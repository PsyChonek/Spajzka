import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabase } from '../config/database';
import { ObjectId } from 'mongodb';
import { Permission, hasPermission } from './permissions';

export interface AuthRequestWithPermissions extends AuthRequest {
  userPermissions?: string[];
  userGlobalRoles?: string[];
}

/**
 * Middleware to check if user has a specific permission within a group context
 * The groupId should be in req.params.id, req.params.groupId, or req.body.groupId
 */
export function requirePermission(permission: Permission) {
  return async (req: AuthRequestWithPermissions, res: Response, next: NextFunction) => {
    try {
      const db = getDatabase();

      // Get groupId from various sources
      // First check explicit groupId in params or body
      let groupId = req.params.groupId || req.body.groupId;
      
      // Don't use req.params.id for groupId as it might be an item ID in routes like /shopping/:id
      // Only use req.params.id if it's actually from /groups/:id route
      if (!groupId && req.baseUrl.includes('/groups') && req.params.id) {
        groupId = req.params.id;
      }

      // For routes like /pantry or /shopping, get the user's active group
      if (!groupId) {
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
        if (!user) {
          return res.status(401).json({
            message: 'User not found',
            code: 'UNAUTHORIZED'
          });
        }

        // Use activeGroupId if available
        if (user.activeGroupId) {
          groupId = user.activeGroupId.toString();
        } else {
          // Get user's group (personal or shared)
          const userGroup = await db.collection('groups').findOne({
            'members.userId': new ObjectId(req.userId)
          });

          if (!userGroup) {
            // User has no group, create a personal one
            const personalGroup = {
              name: `${user.name}'s Personal Group`,
              isPersonal: true,
              members: [{
                userId: new ObjectId(req.userId),
                role: 'admin'
              }],
              inviteEnabled: false,
              createdAt: new Date(),
              updatedAt: new Date()
            };

            const result = await db.collection('groups').insertOne(personalGroup);
            groupId = result.insertedId.toString();

            await db.collection('users').updateOne(
              { _id: new ObjectId(req.userId) },
              { $set: { personalGroupId: result.insertedId, activeGroupId: result.insertedId } }
            );
          } else {
            groupId = userGroup._id.toString();
          }
        }
      }

      if (!ObjectId.isValid(groupId)) {
        return res.status(400).json({
          message: 'Invalid group ID',
          code: 'INVALID_GROUP_ID'
        });
      }

      // Get the group and user's role in it
      const group = await db.collection('groups').findOne({ _id: new ObjectId(groupId) });

      if (!group) {
        return res.status(404).json({
          message: 'Group not found',
          code: 'GROUP_NOT_FOUND'
        });
      }

      // Find user's role in this group
      const member = group.members?.find(
        (m: any) => m.userId.toString() === req.userId
      );

      if (!member) {
        return res.status(403).json({
          message: 'User is not a member of this group',
          code: 'FORBIDDEN'
        });
      }

      // Get role permissions
      const role = await db.collection('roles').findOne({ _id: member.role });

      if (!role) {
        return res.status(500).json({
          message: 'Role not found',
          code: 'ROLE_NOT_FOUND'
        });
      }

      // Check if user has the required permission
      if (!hasPermission(role.permissions, permission)) {
        return res.status(403).json({
          message: `Permission denied. Required: ${permission}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // Attach permissions to request for potential further use
      req.userPermissions = role.permissions;

      next();
    } catch (error) {
      console.error('Error checking permissions:', error);
      res.status(500).json({
        message: 'Error checking permissions',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
}

/**
 * Middleware to check if user has a global permission (e.g., system_moderator)
 */
export function requireGlobalPermission(permission: Permission) {
  return async (req: AuthRequestWithPermissions, res: Response, next: NextFunction) => {
    try {
      const db = getDatabase();

      // Get user's global roles
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(req.userId) },
        { projection: { globalRoles: 1 } }
      );

      if (!user || !user.globalRoles || user.globalRoles.length === 0) {
        return res.status(403).json({
          message: 'Global permission denied',
          code: 'INSUFFICIENT_GLOBAL_PERMISSIONS'
        });
      }

      // Check all global roles for the permission
      const roles = await db.collection('roles')
        .find({ _id: { $in: user.globalRoles }, isGlobal: true })
        .toArray();

      const allPermissions = roles.flatMap((r: any) => r.permissions);

      if (!hasPermission(allPermissions, permission)) {
        return res.status(403).json({
          message: `Global permission denied. Required: ${permission}`,
          code: 'INSUFFICIENT_GLOBAL_PERMISSIONS'
        });
      }

      req.userGlobalRoles = user.globalRoles;
      req.userPermissions = allPermissions;

      next();
    } catch (error) {
      console.error('Error checking global permissions:', error);
      res.status(500).json({
        message: 'Error checking global permissions',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
}

/**
 * Get user's permissions for a specific group
 */
export async function getUserPermissions(
  userId: string,
  groupId: string
): Promise<string[]> {
  const db = getDatabase();

  const group = await db.collection('groups').findOne({ _id: new ObjectId(groupId) });

  if (!group) {
    return [];
  }

  const member = group.members?.find((m: any) => m.userId.toString() === userId);

  if (!member) {
    return [];
  }

  const role = await db.collection('roles').findOne({ _id: member.role });

  return role?.permissions || [];
}
