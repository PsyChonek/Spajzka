import { Router, Response } from 'express';
import { getDatabase } from '../config/database';
import { ObjectId } from 'mongodb';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requirePermission, requireGlobalPermission } from '../rbac/middleware';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     GlobalItem:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Item ID
 *         name:
 *           type: string
 *           description: Item name
 *         category:
 *           type: string
 *           description: Item category
 *         icon:
 *           type: string
 *           description: Emoji icon
 *         defaultUnit:
 *           type: string
 *           description: Default unit of measurement
 *         barcode:
 *           type: string
 *           description: Barcode
 *         isActive:
 *           type: boolean
 *           description: Whether item is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - name
 *         - category
 *     GroupItem:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Item ID
 *         groupId:
 *           type: string
 *           description: Group ID this item belongs to
 *         name:
 *           type: string
 *           description: Item name
 *         category:
 *           type: string
 *           description: Item category
 *         icon:
 *           type: string
 *           description: Emoji icon
 *         defaultUnit:
 *           type: string
 *           description: Default unit of measurement
 *         barcode:
 *           type: string
 *           description: Barcode
 *         createdBy:
 *           type: string
 *           description: User ID who created this item
 *         createdAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - name
 *         - category
 *         - groupId
 *     CreateGlobalItemRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         category:
 *           type: string
 *         icon:
 *           type: string
 *         defaultUnit:
 *           type: string
 *         barcode:
 *           type: string
 *       required:
 *         - name
 *         - category
 *     CreateGroupItemRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         category:
 *           type: string
 *         icon:
 *           type: string
 *         defaultUnit:
 *           type: string
 *         barcode:
 *           type: string
 *       required:
 *         - name
 *         - category
 */

/**
 * @openapi
 * /api/items:
 *   get:
 *     summary: Get all items
 *     description: Get both global items and group items for user's group
 *     tags:
 *       - Items
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Combined list of items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 globalItems:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GlobalItem'
 *                 groupItems:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GroupItem'
 */
router.get('/items', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();

    // Get user to find their active group
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'NOT_FOUND'
      });
    }

    // Determine which group to use
    let groupId = user.activeGroupId;

    // If no active group set, find user's first NON-PERSONAL group
    if (!groupId) {
      // First try to find a non-personal group
      const nonPersonalGroup = await db.collection('groups').findOne({
        'members.userId': new ObjectId(req.userId),
        isPersonal: { $ne: true }
      });

      if (nonPersonalGroup) {
        groupId = nonPersonalGroup._id;
        console.log('[Items API] Using non-personal group:', nonPersonalGroup.name);
      } else {
        // Fall back to personal group if no other group exists
        const personalGroup = await db.collection('groups').findOne({
          'members.userId': new ObjectId(req.userId),
          isPersonal: true
        });

        if (!personalGroup) {
          return res.status(404).json({
            message: 'User is not in any group',
            code: 'NOT_IN_GROUP'
          });
        }

        groupId = personalGroup._id;
        console.log('[Items API] Using personal group (no other groups available)');
      }

      // Set this as the active group for future requests
      await db.collection('users').updateOne(
        { _id: new ObjectId(req.userId) },
        { $set: { activeGroupId: groupId } }
      );
    }

    // Get active global items
    const globalItems = await db.collection('globalItems')
      .find({ isActive: true })
      .toArray();

    // Get group items for the active group
    const groupItems = await db.collection('groupItems')
      .find({ groupId: groupId })
      .toArray();

    res.json({
      globalItems: globalItems.map(item => ({
        ...item,
        _id: item._id.toString(),
        type: 'global'
      })),
      groupItems: groupItems.map(item => ({
        ...item,
        _id: item._id.toString(),
        groupId: item.groupId.toString(),
        createdBy: item.createdBy?.toString(),
        type: 'group'
      }))
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      message: 'Failed to fetch items',
      code: 'FETCH_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/items/global:
 *   get:
 *     summary: Get all global items
 *     description: Get all active global items
 *     tags:
 *       - Items
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of global items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GlobalItem'
 */
router.get('/items/global', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const globalItems = await db.collection('globalItems')
      .find({ isActive: true })
      .toArray();

    res.json(globalItems.map(item => ({
      ...item,
      _id: item._id.toString()
    })));
  } catch (error) {
    console.error('Error fetching global items:', error);
    res.status(500).json({
      message: 'Failed to fetch global items',
      code: 'FETCH_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/items/global:
 *   post:
 *     summary: Create global item
 *     description: Create a new global item (requires global_items:create permission)
 *     tags:
 *       - Items
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGlobalItemRequest'
 *     responses:
 *       201:
 *         description: Global item created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GlobalItem'
 *       403:
 *         description: Insufficient permissions
 */
router.post('/items/global', authMiddleware, requireGlobalPermission('global_items:create'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { name, category, icon, defaultUnit, barcode } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        message: 'Missing required fields: name, category',
        code: 'VALIDATION_ERROR'
      });
    }

    const newItem = {
      name: name.trim(),
      category: category.trim(),
      icon: icon || null,
      defaultUnit: defaultUnit || null,
      barcode: barcode || null,
      createdBy: new ObjectId(req.userId),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('globalItems').insertOne(newItem);
    const createdItem = await db.collection('globalItems').findOne({ _id: result.insertedId });

    res.status(201).json({
      ...createdItem,
      _id: createdItem!._id.toString(),
      createdBy: createdItem!.createdBy?.toString()
    });
  } catch (error) {
    console.error('Error creating global item:', error);
    res.status(500).json({
      message: 'Failed to create global item',
      code: 'CREATE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/items/global/{id}:
 *   put:
 *     summary: Update global item
 *     description: Update a global item (requires global_items:update permission)
 *     tags:
 *       - Items
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
 *             $ref: '#/components/schemas/CreateGlobalItemRequest'
 *     responses:
 *       200:
 *         description: Global item updated
 *       403:
 *         description: Insufficient permissions
 */
router.put('/items/global/:id', authMiddleware, requireGlobalPermission('global_items:update'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { name, category, icon, defaultUnit, barcode } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid item ID',
        code: 'INVALID_ID'
      });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (icon !== undefined) updateData.icon = icon;
    if (defaultUnit !== undefined) updateData.defaultUnit = defaultUnit;
    if (barcode !== undefined) updateData.barcode = barcode;

    const result = await db.collection('globalItems').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({
        message: 'Global item not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      ...result,
      _id: result._id.toString(),
      createdBy: result.createdBy?.toString()
    });
  } catch (error) {
    console.error('Error updating global item:', error);
    res.status(500).json({
      message: 'Failed to update global item',
      code: 'UPDATE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/items/global/{id}:
 *   delete:
 *     summary: Delete global item
 *     description: Deactivate a global item (requires global_items:delete permission)
 *     tags:
 *       - Items
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
 *         description: Global item deleted
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/items/global/:id', authMiddleware, requireGlobalPermission('global_items:delete'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid item ID',
        code: 'INVALID_ID'
      });
    }

    const itemId = new ObjectId(id);

    // Soft delete by setting isActive to false
    const result = await db.collection('globalItems').updateOne(
      { _id: itemId },
      { $set: { isActive: false, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: 'Global item not found',
        code: 'NOT_FOUND'
      });
    }

    // Cascade delete: Remove all references in pantry and shopping
    await Promise.all([
      db.collection('pantry').deleteMany({
        itemId: itemId,
        itemType: 'global'
      }),
      db.collection('shopping').deleteMany({
        itemId: itemId,
        itemType: 'global'
      })
    ]);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting global item:', error);
    res.status(500).json({
      message: 'Failed to delete global item',
      code: 'DELETE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/items/group:
 *   get:
 *     summary: Get group items
 *     description: Get all items for user's group
 *     tags:
 *       - Items
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of group items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GroupItem'
 */
router.get('/items/group', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();

    // Get user's group
    const userGroup = await db.collection('groups').findOne({
      'members.userId': new ObjectId(req.userId)
    });

    if (!userGroup) {
      return res.status(404).json({
        message: 'User has no group',
        code: 'NO_GROUP'
      });
    }

    const groupItems = await db.collection('groupItems')
      .find({ groupId: userGroup._id })
      .toArray();

    res.json(groupItems.map(item => ({
      ...item,
      _id: item._id.toString(),
      groupId: item.groupId.toString(),
      createdBy: item.createdBy?.toString()
    })));
  } catch (error) {
    console.error('Error fetching group items:', error);
    res.status(500).json({
      message: 'Failed to fetch group items',
      code: 'FETCH_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/items/group:
 *   post:
 *     summary: Create group item
 *     description: Create a new group-specific item (requires group_items:create permission)
 *     tags:
 *       - Items
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGroupItemRequest'
 *     responses:
 *       201:
 *         description: Group item created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GroupItem'
 *       403:
 *         description: Insufficient permissions
 */
router.post('/items/group', authMiddleware, requirePermission('group_items:create'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { name, category, icon, defaultUnit, barcode } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        message: 'Missing required fields: name, category',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get user's group
    const userGroup = await db.collection('groups').findOne({
      'members.userId': new ObjectId(req.userId)
    });

    if (!userGroup) {
      return res.status(404).json({
        message: 'User has no group',
        code: 'NO_GROUP'
      });
    }

    const newItem = {
      groupId: userGroup._id,
      name: name.trim(),
      category: category.trim(),
      icon: icon || null,
      defaultUnit: defaultUnit || null,
      barcode: barcode || null,
      createdBy: new ObjectId(req.userId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('groupItems').insertOne(newItem);
    const createdItem = await db.collection('groupItems').findOne({ _id: result.insertedId });

    res.status(201).json({
      ...createdItem,
      _id: createdItem!._id.toString(),
      groupId: createdItem!.groupId.toString(),
      createdBy: createdItem!.createdBy?.toString()
    });
  } catch (error) {
    console.error('Error creating group item:', error);
    res.status(500).json({
      message: 'Failed to create group item',
      code: 'CREATE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/items/group/{id}:
 *   put:
 *     summary: Update group item
 *     description: Update a group item (requires group_items:update permission)
 *     tags:
 *       - Items
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
 *             $ref: '#/components/schemas/CreateGroupItemRequest'
 *     responses:
 *       200:
 *         description: Group item updated
 *       403:
 *         description: Insufficient permissions
 */
router.put('/items/group/:id', authMiddleware, requirePermission('group_items:update'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { name, category, icon, defaultUnit, barcode } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid item ID',
        code: 'INVALID_ID'
      });
    }

    // Get user's group
    const userGroup = await db.collection('groups').findOne({
      'members.userId': new ObjectId(req.userId)
    });

    if (!userGroup) {
      return res.status(404).json({
        message: 'User has no group',
        code: 'NO_GROUP'
      });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (icon !== undefined) updateData.icon = icon;
    if (defaultUnit !== undefined) updateData.defaultUnit = defaultUnit;
    if (barcode !== undefined) updateData.barcode = barcode;

    const result = await db.collection('groupItems').findOneAndUpdate(
      { _id: new ObjectId(id), groupId: userGroup._id },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({
        message: 'Group item not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      ...result,
      _id: result._id.toString(),
      groupId: result.groupId.toString(),
      createdBy: result.createdBy?.toString()
    });
  } catch (error) {
    console.error('Error updating group item:', error);
    res.status(500).json({
      message: 'Failed to update group item',
      code: 'UPDATE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/items/group/{id}:
 *   delete:
 *     summary: Delete group item
 *     description: Delete a group item (requires group_items:delete permission)
 *     tags:
 *       - Items
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
 *         description: Group item deleted
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/items/group/:id', authMiddleware, requirePermission('group_items:delete'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid item ID',
        code: 'INVALID_ID'
      });
    }

    // Get user's group
    const userGroup = await db.collection('groups').findOne({
      'members.userId': new ObjectId(req.userId)
    });

    if (!userGroup) {
      return res.status(404).json({
        message: 'User has no group',
        code: 'NO_GROUP'
      });
    }

    const itemId = new ObjectId(id);

    const result = await db.collection('groupItems').deleteOne({
      _id: itemId,
      groupId: userGroup._id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: 'Group item not found',
        code: 'NOT_FOUND'
      });
    }

    // Cascade delete: Remove all references in pantry and shopping for this group
    await Promise.all([
      db.collection('pantry').deleteMany({
        itemId: itemId,
        itemType: 'group',
        groupId: userGroup._id
      }),
      db.collection('shopping').deleteMany({
        itemId: itemId,
        itemType: 'group',
        groupId: userGroup._id
      })
    ]);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting group item:', error);
    res.status(500).json({
      message: 'Failed to delete group item',
      code: 'DELETE_ERROR'
    });
  }
});

export default router;
