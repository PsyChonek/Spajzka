import { Router, Response } from 'express';
import { getDatabase } from '../config/database';
import { ObjectId } from 'mongodb';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../rbac/middleware';
import crypto from 'crypto';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Group:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Group ID
 *         name:
 *           type: string
 *           description: Group name
 *         isPersonal:
 *           type: boolean
 *           description: Whether this is a personal group
 *         members:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, moderator, member]
 *           description: Array of members with their roles
 *         inviteCode:
 *           type: string
 *           description: Invite code for joining group
 *         inviteEnabled:
 *           type: boolean
 *           description: Whether invite is enabled
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - name
 *     CreateGroupRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Group name
 *       required:
 *         - name
 *     UpdateGroupRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Group name
 *     JoinGroupRequest:
 *       type: object
 *       properties:
 *         inviteCode:
 *           type: string
 *           description: Invite code to join group
 *       required:
 *         - inviteCode
 *     GroupMember:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, moderator, member]
 *     AssignRoleRequest:
 *       type: object
 *       properties:
 *         role:
 *           type: string
 *           enum: [admin, moderator, member]
 *       required:
 *         - role
 */

// Helper function to generate invite code
function generateInviteCode(): string {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

/**
 * @openapi
 * /api/groups:
 *   post:
 *     summary: Create a new group
 *     description: Create a new shared group with the authenticated user as admin
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGroupRequest'
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       400:
 *         description: Bad request
 */
router.post('/groups', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        message: 'Missing required field: name',
        code: 'VALIDATION_ERROR'
      });
    }

    const inviteCode = generateInviteCode();

    const newGroup = {
      name: name.trim(),
      isPersonal: false,
      members: [{
        userId: new ObjectId(req.userId),
        role: 'admin'
      }],
      inviteCode,
      inviteEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('groups').insertOne(newGroup);
    const createdGroup = await db.collection('groups').findOne({ _id: result.insertedId });

    res.status(201).json({
      ...createdGroup,
      _id: createdGroup!._id.toString(),
      members: createdGroup!.members.map((m: any) => ({
        userId: m.userId.toString(),
        role: m.role
      }))
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      message: 'Failed to create group',
      code: 'CREATE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/groups/my:
 *   get:
 *     summary: Get user's groups
 *     description: Get all groups that the authenticated user is a member of
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Group'
 */
router.get('/groups/my', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();

    const groups = await db.collection('groups').find({
      'members.userId': new ObjectId(req.userId)
    }).toArray();

    const formattedGroups = groups.map(group => ({
      ...group,
      _id: group._id.toString(),
      members: group.members.map((m: any) => ({
        userId: m.userId.toString(),
        role: m.role
      }))
    }));

    res.json(formattedGroups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({
      message: 'Failed to fetch groups',
      code: 'FETCH_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/groups/{id}:
 *   get:
 *     summary: Get group by ID
 *     description: Get a specific group (user must be a member)
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       403:
 *         description: User is not a member of this group
 *       404:
 *         description: Group not found
 */
router.get('/groups/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid group ID',
        code: 'INVALID_ID'
      });
    }

    const group = await db.collection('groups').findOne({ _id: new ObjectId(id) });

    if (!group) {
      return res.status(404).json({
        message: 'Group not found',
        code: 'NOT_FOUND'
      });
    }

    // Check if user is a member
    const isMember = group.members.some((member: any) =>
      member.userId.toString() === req.userId
    );

    if (!isMember) {
      return res.status(403).json({
        message: 'User is not a member of this group',
        code: 'FORBIDDEN'
      });
    }

    res.json({
      ...group,
      _id: group._id.toString(),
      members: group.members.map((m: any) => ({
        userId: m.userId.toString(),
        role: m.role
      }))
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({
      message: 'Failed to fetch group',
      code: 'FETCH_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/groups/{id}:
 *   put:
 *     summary: Update group
 *     description: Update group details (requires group:update permission)
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateGroupRequest'
 *     responses:
 *       200:
 *         description: Group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       403:
 *         description: Insufficient permissions
 */
router.put('/groups/:id', authMiddleware, requirePermission('group:update'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { name } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid group ID',
        code: 'INVALID_ID'
      });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined && name.trim().length > 0) {
      updateData.name = name.trim();
    }

    const updatedGroup = await db.collection('groups').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!updatedGroup) {
      return res.status(404).json({
        message: 'Group not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      ...updatedGroup,
      _id: updatedGroup._id.toString(),
      members: updatedGroup.members.map((m: any) => ({
        userId: m.userId.toString(),
        role: m.role
      }))
    });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({
      message: 'Failed to update group',
      code: 'UPDATE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/groups/{id}:
 *   delete:
 *     summary: Delete group
 *     description: Delete a group (requires group:delete permission)
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Group deleted successfully
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/groups/:id', authMiddleware, requirePermission('group:delete'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid group ID',
        code: 'INVALID_ID'
      });
    }

    const group = await db.collection('groups').findOne({ _id: new ObjectId(id) });

    if (!group) {
      return res.status(404).json({
        message: 'Group not found',
        code: 'NOT_FOUND'
      });
    }

    // Cannot delete personal groups
    if (group.isPersonal) {
      return res.status(400).json({
        message: 'Cannot delete personal group',
        code: 'CANNOT_DELETE_PERSONAL_GROUP'
      });
    }

    await db.collection('groups').deleteOne({ _id: new ObjectId(id) });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({
      message: 'Failed to delete group',
      code: 'DELETE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/groups/join:
 *   post:
 *     summary: Join a group
 *     description: Join a group using an invite code
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JoinGroupRequest'
 *     responses:
 *       200:
 *         description: Successfully joined group
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       400:
 *         description: Invalid invite code or user already in group
 */
router.post('/groups/join', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { inviteCode } = req.body;

    if (!inviteCode || inviteCode.trim().length === 0) {
      return res.status(400).json({
        message: 'Missing required field: inviteCode',
        code: 'VALIDATION_ERROR'
      });
    }

    // Find group by invite code
    const group = await db.collection('groups').findOne({
      inviteCode: inviteCode.trim().toUpperCase(),
      isPersonal: false
    });

    if (!group) {
      return res.status(404).json({
        message: 'Invalid invite code',
        code: 'INVALID_INVITE_CODE'
      });
    }

    if (!group.inviteEnabled) {
      return res.status(400).json({
        message: 'Invites are disabled for this group',
        code: 'INVITES_DISABLED'
      });
    }

    // Check if user is already a member of this specific group
    const isAlreadyMember = group.members.some((m: any) =>
      m.userId.toString() === req.userId
    );

    if (isAlreadyMember) {
      return res.status(400).json({
        message: 'You are already a member of this group',
        code: 'ALREADY_MEMBER'
      });
    }

    // Add user to group with 'member' role
    const updatedGroup = await db.collection('groups').findOneAndUpdate(
      { _id: group._id },
      {
        $push: {
          members: {
            userId: new ObjectId(req.userId),
            role: 'member'
          }
        } as any,
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );

    res.json({
      ...updatedGroup,
      _id: updatedGroup!._id.toString(),
      members: updatedGroup!.members.map((m: any) => ({
        userId: m.userId.toString(),
        role: m.role
      }))
    });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({
      message: 'Failed to join group',
      code: 'JOIN_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/groups/{id}/leave:
 *   post:
 *     summary: Leave a group
 *     description: Leave a group (admin cannot leave if there are other members)
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully left group
 *       400:
 *         description: Admin cannot leave group with other members
 */
router.post('/groups/:id/leave', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid group ID',
        code: 'INVALID_ID'
      });
    }

    const group = await db.collection('groups').findOne({ _id: new ObjectId(id) });

    if (!group) {
      return res.status(404).json({
        message: 'Group not found',
        code: 'NOT_FOUND'
      });
    }

    // Cannot leave personal group
    if (group.isPersonal) {
      return res.status(400).json({
        message: 'Cannot leave personal group',
        code: 'CANNOT_LEAVE_PERSONAL_GROUP'
      });
    }

    // Check if user is a member
    const member = group.members.find((m: any) =>
      m.userId.toString() === req.userId
    );

    if (!member) {
      return res.status(403).json({
        message: 'User is not a member of this group',
        code: 'FORBIDDEN'
      });
    }

    // Check if user is admin and there are other members
    if (member.role === 'admin' && group.members.length > 1) {
      return res.status(400).json({
        message: 'Admin cannot leave group with other members. Transfer admin or remove all members first.',
        code: 'ADMIN_CANNOT_LEAVE'
      });
    }

    // If admin is the only member, delete the group
    if (member.role === 'admin' && group.members.length === 1) {
      await db.collection('groups').deleteOne({ _id: new ObjectId(id) });
      return res.json({ message: 'Group deleted successfully' });
    }

    // Remove user from group
    await db.collection('groups').updateOne(
      { _id: new ObjectId(id) },
      {
        $pull: { members: { userId: new ObjectId(req.userId) } } as any,
        $set: { updatedAt: new Date() }
      }
    );

    res.json({ message: 'Successfully left group' });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({
      message: 'Failed to leave group',
      code: 'LEAVE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/groups/{id}/members:
 *   get:
 *     summary: Get group members
 *     description: Get all members of a group with their details
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of group members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GroupMember'
 */
router.get('/groups/:id/members', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid group ID',
        code: 'INVALID_ID'
      });
    }

    const group = await db.collection('groups').findOne({ _id: new ObjectId(id) });

    if (!group) {
      return res.status(404).json({
        message: 'Group not found',
        code: 'NOT_FOUND'
      });
    }

    // Check if user is a member
    const isMember = group.members.some((member: any) =>
      member.userId.toString() === req.userId
    );

    if (!isMember) {
      return res.status(403).json({
        message: 'User is not a member of this group',
        code: 'FORBIDDEN'
      });
    }

    // Get member details
    const memberIds = group.members.map((m: any) => m.userId);
    const users = await db.collection('users')
      .find(
        { _id: { $in: memberIds } },
        { projection: { password: 0 } }
      )
      .toArray();

    const membersWithRole = users.map(user => {
      const memberInfo = group.members.find((m: any) => m.userId.toString() === user._id.toString());
      return {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: memberInfo?.role || 'member'
      };
    });

    res.json(membersWithRole);
  } catch (error) {
    console.error('Error fetching group members:', error);
    res.status(500).json({
      message: 'Failed to fetch group members',
      code: 'FETCH_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/groups/{id}/kick/{userId}:
 *   delete:
 *     summary: Kick user from group
 *     description: Remove a user from the group (requires group:manage_members permission)
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User kicked successfully
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/groups/:id/kick/:userId', authMiddleware, requirePermission('group:manage_members'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id, userId } = req.params;

    if (!ObjectId.isValid(id) || !ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: 'Invalid group ID or user ID',
        code: 'INVALID_ID'
      });
    }

    const group = await db.collection('groups').findOne({ _id: new ObjectId(id) });

    if (!group) {
      return res.status(404).json({
        message: 'Group not found',
        code: 'NOT_FOUND'
      });
    }

    // Find the member to be kicked
    const memberToKick = group.members.find((m: any) => m.userId.toString() === userId);

    if (!memberToKick) {
      return res.status(404).json({
        message: 'User is not a member of this group',
        code: 'NOT_FOUND'
      });
    }

    // Cannot kick admin
    if (memberToKick.role === 'admin') {
      return res.status(400).json({
        message: 'Cannot kick admin',
        code: 'CANNOT_KICK_ADMIN'
      });
    }

    // Remove user from group
    await db.collection('groups').updateOne(
      { _id: new ObjectId(id) },
      {
        $pull: { members: { userId: new ObjectId(userId) } } as any,
        $set: { updatedAt: new Date() }
      }
    );

    res.json({ message: 'User kicked successfully' });
  } catch (error) {
    console.error('Error kicking user:', error);
    res.status(500).json({
      message: 'Failed to kick user',
      code: 'KICK_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/groups/{id}/members/{userId}/role:
 *   put:
 *     summary: Assign role to member
 *     description: Change a member's role (requires group:manage_roles permission)
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignRoleRequest'
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *       403:
 *         description: Insufficient permissions
 */
router.put('/groups/:id/members/:userId/role', authMiddleware, requirePermission('group:manage_roles'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id, userId } = req.params;
    const { role } = req.body;

    if (!ObjectId.isValid(id) || !ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: 'Invalid group ID or user ID',
        code: 'INVALID_ID'
      });
    }

    if (!['admin', 'moderator', 'member'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid role. Must be admin, moderator, or member',
        code: 'INVALID_ROLE'
      });
    }

    const group = await db.collection('groups').findOne({ _id: new ObjectId(id) });

    if (!group) {
      return res.status(404).json({
        message: 'Group not found',
        code: 'NOT_FOUND'
      });
    }

    // Find the member
    const memberIndex = group.members.findIndex((m: any) => m.userId.toString() === userId);

    if (memberIndex === -1) {
      return res.status(404).json({
        message: 'User is not a member of this group',
        code: 'NOT_FOUND'
      });
    }

    // Update the member's role
    await db.collection('groups').updateOne(
      { _id: new ObjectId(id), 'members.userId': new ObjectId(userId) },
      {
        $set: {
          'members.$.role': role,
          updatedAt: new Date()
        }
      }
    );

    res.json({ message: 'Role assigned successfully', role });
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({
      message: 'Failed to assign role',
      code: 'ASSIGN_ROLE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/groups/{id}/regenerate-invite:
 *   post:
 *     summary: Regenerate invite code
 *     description: Generate a new invite code for the group (requires group:update permission)
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite code regenerated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inviteCode:
 *                   type: string
 */
router.post('/groups/:id/regenerate-invite', authMiddleware, requirePermission('group:update'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid group ID',
        code: 'INVALID_ID'
      });
    }

    const group = await db.collection('groups').findOne({ _id: new ObjectId(id) });

    if (!group) {
      return res.status(404).json({
        message: 'Group not found',
        code: 'NOT_FOUND'
      });
    }

    const newInviteCode = generateInviteCode();

    await db.collection('groups').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          inviteCode: newInviteCode,
          updatedAt: new Date()
        }
      }
    );

    res.json({ inviteCode: newInviteCode });
  } catch (error) {
    console.error('Error regenerating invite code:', error);
    res.status(500).json({
      message: 'Failed to regenerate invite code',
      code: 'REGENERATE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/groups/{id}/toggle-invite:
 *   post:
 *     summary: Toggle invite enabled/disabled
 *     description: Enable or disable invites for the group (requires group:update permission)
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *             required:
 *               - enabled
 *     responses:
 *       200:
 *         description: Invite status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inviteEnabled:
 *                   type: boolean
 */
router.post('/groups/:id/toggle-invite', authMiddleware, requirePermission('group:update'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { enabled } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid group ID',
        code: 'INVALID_ID'
      });
    }

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        message: 'Missing or invalid field: enabled (must be boolean)',
        code: 'VALIDATION_ERROR'
      });
    }

    const group = await db.collection('groups').findOne({ _id: new ObjectId(id) });

    if (!group) {
      return res.status(404).json({
        message: 'Group not found',
        code: 'NOT_FOUND'
      });
    }

    await db.collection('groups').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          inviteEnabled: enabled,
          updatedAt: new Date()
        }
      }
    );

    res.json({ inviteEnabled: enabled });
  } catch (error) {
    console.error('Error toggling invite:', error);
    res.status(500).json({
      message: 'Failed to toggle invite',
      code: 'TOGGLE_ERROR'
    });
  }
});

export default router;
