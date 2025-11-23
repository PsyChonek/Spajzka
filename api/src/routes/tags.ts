import { Router, Response } from 'express';
import { getDatabase } from '../config/database';
import { ObjectId } from 'mongodb';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Tag:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Tag ID
 *         groupId:
 *           type: string
 *           description: Group ID this tag belongs to
 *         name:
 *           type: string
 *           description: Tag name
 *         color:
 *           type: string
 *           description: Tag color (hex code)
 *         icon:
 *           type: string
 *           description: Optional emoji icon
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - name
 *         - groupId
 *     CreateTagRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         color:
 *           type: string
 *           description: Tag color (hex code)
 *         icon:
 *           type: string
 *           description: Optional emoji icon
 *       required:
 *         - name
 */

/**
 * @openapi
 * /api/tags:
 *   get:
 *     summary: Get tags for user's groups
 *     description: Get all tags for groups the authenticated user is a member of
 *     tags:
 *       - Tags
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tags from user's groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tag'
 */
router.get('/tags', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();

    // Get all groups the user is a member of
    const groups = await db.collection('groups')
      .find({ 'members.userId': new ObjectId(req.userId) })
      .toArray();

    const groupIds = groups.map(g => g._id);

    // Get all tags for these groups
    const tags = await db.collection('tags')
      .find({ groupId: { $in: groupIds } })
      .sort({ name: 1 })
      .toArray();

    res.json(tags.map(tag => ({
      ...tag,
      _id: tag._id.toString(),
      groupId: tag.groupId.toString()
    })));
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      message: 'Failed to fetch tags',
      code: 'FETCH_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/tags:
 *   post:
 *     summary: Create tag
 *     description: Create a new tag for the user's active group
 *     tags:
 *       - Tags
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTagRequest'
 *     responses:
 *       201:
 *         description: Tag created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 */
router.post('/tags', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { name, color, icon } = req.body;

    if (!name) {
      return res.status(400).json({
        message: 'Missing required field: name',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get user to find active group
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
    let groupId = user?.activeGroupId;

    // If no active group set, find user's first NON-PERSONAL group
    if (!groupId) {
      // First try to find a non-personal group
      const nonPersonalGroup = await db.collection('groups').findOne({
        'members.userId': new ObjectId(req.userId),
        isPersonal: { $ne: true }
      });

      if (nonPersonalGroup) {
        groupId = nonPersonalGroup._id;
      } else {
        // Fall back to personal group if no other group exists
        const personalGroup = await db.collection('groups').findOne({
          'members.userId': new ObjectId(req.userId),
          isPersonal: true
        });

        if (!personalGroup) {
          return res.status(404).json({
            message: 'User has no group',
            code: 'NO_GROUP'
          });
        }

        groupId = personalGroup._id;
      }
    }

    // Check for duplicate tag name for this group
    const existingTag = await db.collection('tags').findOne({
      groupId: new ObjectId(groupId),
      name: name.trim()
    });

    if (existingTag) {
      return res.status(400).json({
        message: 'Tag with this name already exists in this group',
        code: 'DUPLICATE_TAG'
      });
    }

    const newTag = {
      groupId: new ObjectId(groupId),
      name: name.trim(),
      color: color?.trim() || '#6200EA', // Default purple color
      icon: icon?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('tags').insertOne(newTag);
    const createdTag = await db.collection('tags').findOne({ _id: result.insertedId });

    res.status(201).json({
      ...createdTag,
      _id: createdTag!._id.toString(),
      groupId: createdTag!.groupId.toString()
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({
      message: 'Failed to create tag',
      code: 'CREATE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/tags/{id}:
 *   put:
 *     summary: Update tag
 *     description: Update a tag (must be in the same group as the user)
 *     tags:
 *       - Tags
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
 *             $ref: '#/components/schemas/CreateTagRequest'
 *     responses:
 *       200:
 *         description: Tag updated
 */
router.put('/tags/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { name, color, icon } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid tag ID',
        code: 'INVALID_ID'
      });
    }

    // Get the tag to verify group membership
    const tag = await db.collection('tags').findOne({ _id: new ObjectId(id) });

    if (!tag) {
      return res.status(404).json({
        message: 'Tag not found',
        code: 'NOT_FOUND'
      });
    }

    // Verify user is a member of the tag's group
    const group = await db.collection('groups').findOne({
      _id: tag.groupId,
      'members.userId': new ObjectId(req.userId)
    });

    if (!group) {
      return res.status(403).json({
        message: 'You do not have permission to update this tag',
        code: 'FORBIDDEN'
      });
    }

    // Check for duplicate tag name in this group (excluding current tag)
    if (name) {
      const existingTag = await db.collection('tags').findOne({
        groupId: tag.groupId,
        name: name.trim(),
        _id: { $ne: new ObjectId(id) }
      });

      if (existingTag) {
        return res.status(400).json({
          message: 'Tag with this name already exists in this group',
          code: 'DUPLICATE_TAG'
        });
      }
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (color !== undefined) updateData.color = color.trim();
    if (icon !== undefined) updateData.icon = icon?.trim() || null;

    const result = await db.collection('tags').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({
        message: 'Tag not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      ...result,
      _id: result._id.toString(),
      groupId: result.groupId.toString()
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({
      message: 'Failed to update tag',
      code: 'UPDATE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/tags/{id}:
 *   delete:
 *     summary: Delete tag
 *     description: Delete a tag (must be in the same group as the user)
 *     tags:
 *       - Tags
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
 *         description: Tag deleted
 */
router.delete('/tags/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid tag ID',
        code: 'INVALID_ID'
      });
    }

    const tagId = new ObjectId(id);

    // Get the tag to verify group membership
    const tag = await db.collection('tags').findOne({ _id: tagId });

    if (!tag) {
      return res.status(404).json({
        message: 'Tag not found',
        code: 'NOT_FOUND'
      });
    }

    // Verify user is a member of the tag's group
    const group = await db.collection('groups').findOne({
      _id: tag.groupId,
      'members.userId': new ObjectId(req.userId)
    });

    if (!group) {
      return res.status(403).json({
        message: 'You do not have permission to delete this tag',
        code: 'FORBIDDEN'
      });
    }

    const result = await db.collection('tags').deleteOne({ _id: tagId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: 'Tag not found',
        code: 'NOT_FOUND'
      });
    }

    // Remove tag references from recipes and items
    await Promise.all([
      db.collection('recipes').updateMany(
        { tags: tagId },
        { $pull: { tags: tagId } } as any
      ),
      db.collection('globalItems').updateMany(
        { tags: tagId },
        { $pull: { tags: tagId } } as any
      ),
      db.collection('groupItems').updateMany(
        { tags: tagId },
        { $pull: { tags: tagId } } as any
      )
    ]);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({
      message: 'Failed to delete tag',
      code: 'DELETE_ERROR'
    });
  }
});

export default router;
