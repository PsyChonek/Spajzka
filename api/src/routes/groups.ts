import { Router, Response } from 'express';
import { getDatabase } from '../config/database';
import { ObjectId } from 'mongodb';
import { authMiddleware, AuthRequest } from '../middleware/auth';
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
 *         adminId:
 *           type: string
 *           description: Admin user ID
 *         inviteCode:
 *           type: string
 *           description: Invite code for joining group
 *         inviteEnabled:
 *           type: boolean
 *           description: Whether invite is enabled
 *         memberIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of member user IDs
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
 *         isAdmin:
 *           type: boolean
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
 *     description: Create a new group with the authenticated user as admin
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

    // Check if user is already in a group
    const existingMembership = await db.collection('groups').findOne({
      memberIds: new ObjectId(req.userId)
    });

    if (existingMembership) {
      return res.status(400).json({
        message: 'User is already a member of a group',
        code: 'ALREADY_IN_GROUP'
      });
    }

    const inviteCode = generateInviteCode();

    const newGroup = {
      name: name.trim(),
      adminId: new ObjectId(req.userId),
      inviteCode,
      inviteEnabled: true,
      memberIds: [new ObjectId(req.userId)],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('groups').insertOne(newGroup);
    const createdGroup = await db.collection('groups').findOne({ _id: result.insertedId });

    res.status(201).json({
      ...createdGroup,
      _id: createdGroup!._id.toString(),
      adminId: createdGroup!.adminId.toString(),
      memberIds: createdGroup!.memberIds.map((id: ObjectId) => id.toString())
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
 *     summary: Get user's group
 *     description: Get the group that the authenticated user is a member of
 *     tags:
 *       - Groups
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's group
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       404:
 *         description: User is not in any group
 */
router.get('/groups/my', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();

    const group = await db.collection('groups').findOne({
      memberIds: new ObjectId(req.userId)
    });

    if (!group) {
      return res.status(404).json({
        message: 'User is not in any group',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      ...group,
      _id: group._id.toString(),
      adminId: group.adminId.toString(),
      memberIds: group.memberIds.map((id: ObjectId) => id.toString())
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
    const isMember = group.memberIds.some((memberId: ObjectId) =>
      memberId.toString() === req.userId
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
      adminId: group.adminId.toString(),
      memberIds: group.memberIds.map((id: ObjectId) => id.toString())
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
 *     description: Update group details (admin only)
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
 *         description: Only admin can update group
 */
router.put('/groups/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
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

    const group = await db.collection('groups').findOne({ _id: new ObjectId(id) });

    if (!group) {
      return res.status(404).json({
        message: 'Group not found',
        code: 'NOT_FOUND'
      });
    }

    // Check if user is admin
    if (group.adminId.toString() !== req.userId) {
      return res.status(403).json({
        message: 'Only admin can update group',
        code: 'FORBIDDEN'
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

    res.json({
      ...updatedGroup,
      _id: updatedGroup!._id.toString(),
      adminId: updatedGroup!.adminId.toString(),
      memberIds: updatedGroup!.memberIds.map((id: ObjectId) => id.toString())
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
 *     description: Delete a group (admin only)
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
 *         description: Only admin can delete group
 */
router.delete('/groups/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
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

    // Check if user is admin
    if (group.adminId.toString() !== req.userId) {
      return res.status(403).json({
        message: 'Only admin can delete group',
        code: 'FORBIDDEN'
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

    // Check if user is already in a group
    const existingMembership = await db.collection('groups').findOne({
      memberIds: new ObjectId(req.userId)
    });

    if (existingMembership) {
      return res.status(400).json({
        message: 'User is already a member of a group',
        code: 'ALREADY_IN_GROUP'
      });
    }

    // Find group by invite code
    const group = await db.collection('groups').findOne({
      inviteCode: inviteCode.trim().toUpperCase()
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

    // Add user to group
    const updatedGroup = await db.collection('groups').findOneAndUpdate(
      { _id: group._id },
      {
        $addToSet: { memberIds: new ObjectId(req.userId) },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );

    res.json({
      ...updatedGroup,
      _id: updatedGroup!._id.toString(),
      adminId: updatedGroup!.adminId.toString(),
      memberIds: updatedGroup!.memberIds.map((id: ObjectId) => id.toString())
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

    // Check if user is a member
    const isMember = group.memberIds.some((memberId: ObjectId) =>
      memberId.toString() === req.userId
    );

    if (!isMember) {
      return res.status(403).json({
        message: 'User is not a member of this group',
        code: 'FORBIDDEN'
      });
    }

    // Check if user is admin and there are other members
    if (group.adminId.toString() === req.userId && group.memberIds.length > 1) {
      return res.status(400).json({
        message: 'Admin cannot leave group with other members. Transfer admin or remove all members first.',
        code: 'ADMIN_CANNOT_LEAVE'
      });
    }

    // If admin is the only member, delete the group
    if (group.adminId.toString() === req.userId && group.memberIds.length === 1) {
      await db.collection('groups').deleteOne({ _id: new ObjectId(id) });
      return res.json({ message: 'Group deleted successfully' });
    }

    // Remove user from group
    await db.collection('groups').updateOne(
      { _id: new ObjectId(id) },
      {
        $pull: { memberIds: new ObjectId(req.userId) } as any,
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
    const isMember = group.memberIds.some((memberId: ObjectId) =>
      memberId.toString() === req.userId
    );

    if (!isMember) {
      return res.status(403).json({
        message: 'User is not a member of this group',
        code: 'FORBIDDEN'
      });
    }

    // Get member details
    const members = await db.collection('users')
      .find(
        { _id: { $in: group.memberIds } },
        { projection: { password: 0 } }
      )
      .toArray();

    const membersWithRole = members.map(member => ({
      _id: member._id.toString(),
      name: member.name,
      email: member.email,
      isAdmin: member._id.toString() === group.adminId.toString()
    }));

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
 *     description: Remove a user from the group (admin only, cannot kick admin)
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
 *         description: Only admin can kick users
 */
router.delete('/groups/:id/kick/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
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

    // Check if requester is admin
    if (group.adminId.toString() !== req.userId) {
      return res.status(403).json({
        message: 'Only admin can kick users',
        code: 'FORBIDDEN'
      });
    }

    // Cannot kick admin
    if (group.adminId.toString() === userId) {
      return res.status(400).json({
        message: 'Cannot kick admin',
        code: 'CANNOT_KICK_ADMIN'
      });
    }

    // Check if user is a member
    const isMember = group.memberIds.some((memberId: ObjectId) =>
      memberId.toString() === userId
    );

    if (!isMember) {
      return res.status(404).json({
        message: 'User is not a member of this group',
        code: 'NOT_FOUND'
      });
    }

    // Remove user from group
    await db.collection('groups').updateOne(
      { _id: new ObjectId(id) },
      {
        $pull: { memberIds: new ObjectId(userId) } as any,
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
 * /api/groups/{id}/regenerate-invite:
 *   post:
 *     summary: Regenerate invite code
 *     description: Generate a new invite code for the group (admin only)
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
router.post('/groups/:id/regenerate-invite', authMiddleware, async (req: AuthRequest, res: Response) => {
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

    // Check if user is admin
    if (group.adminId.toString() !== req.userId) {
      return res.status(403).json({
        message: 'Only admin can regenerate invite code',
        code: 'FORBIDDEN'
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
 *     description: Enable or disable invites for the group (admin only)
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
router.post('/groups/:id/toggle-invite', authMiddleware, async (req: AuthRequest, res: Response) => {
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

    // Check if user is admin
    if (group.adminId.toString() !== req.userId) {
      return res.status(403).json({
        message: 'Only admin can toggle invite status',
        code: 'FORBIDDEN'
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
