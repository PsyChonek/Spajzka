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
 *     Item:
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
 *         searchNames:
 *           type: array
 *           items:
 *             type: string
 *           description: Additional names for search
 *         itemType:
 *           type: string
 *           enum: [global, group]
 *           description: Item type
 *         groupId:
 *           type: string
 *           description: Group ID (only for group items)
 *         globalItemRef:
 *           type: string
 *           description: Reference to global item if this is a copy
 *         isActive:
 *           type: boolean
 *           description: Whether item is active (only for global items)
 *         createdBy:
 *           type: string
 *           description: User ID who created this item (only for group items)
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tag IDs associated with this item
 *         createdAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - name
 *         - category
 *         - itemType
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
 *         searchNames:
 *           type: array
 *           items:
 *             type: string
 *           description: Additional names for search
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tag IDs to associate with this item
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
 *         searchNames:
 *           type: array
 *           items:
 *             type: string
 *           description: Additional names for search
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tag IDs to associate with this item
 *       required:
 *         - name
 *         - category
 */

/**
 * @openapi
 * /api/items:
 *   get:
 *     summary: Get all items
 *     description: Get group items for user's active group
 *     tags:
 *       - Items
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeGlobal
 *         schema:
 *           type: boolean
 *         description: Include global items (requires global_items:view permission)
 *     responses:
 *       200:
 *         description: List of items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 */
router.get('/items', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const includeGlobal = req.query.includeGlobal === 'true';

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

    // Get group items for the active group
    const groupItems = await db.collection('items')
      .find({ itemType: 'group', groupId: groupId })
      .toArray();

    // If user has permission and requests global items, include them
    if (includeGlobal) {
      // Check if user has permission to view global items
      const userRole = await db.collection('users').findOne(
        { _id: new ObjectId(req.userId) },
        { projection: { roleId: 1 } }
      );

      if (userRole?.roleId) {
        const role = await db.collection('roles').findOne({ _id: userRole.roleId });
        const hasPermission = role?.globalPermissions?.includes('global_items:view');

        if (hasPermission) {
          const globalItems = await db.collection('items')
            .find({ itemType: 'global', isActive: true })
            .toArray();

          res.json({
            groupItems: groupItems.map(item => ({
              ...item,
              _id: item._id.toString(),
              groupId: item.groupId.toString(),
              globalItemRef: item.globalItemRef?.toString(),
              createdBy: item.createdBy?.toString()
            })),
            globalItems: globalItems.map(item => ({
              ...item,
              _id: item._id.toString()
            }))
          });
          return;
        }
      }
    }

    // Default response: only group items
    res.json(groupItems.map(item => ({
      ...item,
      _id: item._id.toString(),
      groupId: item.groupId.toString(),
      globalItemRef: item.globalItemRef?.toString(),
      createdBy: item.createdBy?.toString()
    })));
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
 *                 $ref: '#/components/schemas/Item'
 */
router.get('/items/global', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const globalItems = await db.collection('items')
      .find({ itemType: 'global', isActive: true })
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
 *               $ref: '#/components/schemas/Item'
 *       403:
 *         description: Insufficient permissions
 */
router.post('/items/global', authMiddleware, requireGlobalPermission('global_items:create'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { name, category, icon, defaultUnit, barcode, searchNames, tags } = req.body;

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
      searchNames: Array.isArray(searchNames) ? searchNames.map((n: string) => n.trim()).filter(Boolean) : [],
      tags: Array.isArray(tags) ? tags.filter(Boolean).map((t: string) => new ObjectId(t)) : [],
      itemType: 'global',
      createdBy: new ObjectId(req.userId),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('items').insertOne(newItem);
    const createdItem = await db.collection('items').findOne({ _id: result.insertedId });

    // Sync this new global item to all existing groups
    const allGroups = await db.collection('groups').find({}).toArray();
    const groupItemsToCreate = allGroups.map(group => ({
      groupId: group._id,
      globalItemRef: result.insertedId,
      name: newItem.name,
      category: newItem.category,
      icon: newItem.icon,
      defaultUnit: newItem.defaultUnit,
      barcode: newItem.barcode,
      searchNames: newItem.searchNames,
      tags: newItem.tags,
      itemType: 'group',
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    if (groupItemsToCreate.length > 0) {
      await db.collection('items').insertMany(groupItemsToCreate);
      console.log(`Synced new global item "${newItem.name}" to ${groupItemsToCreate.length} groups`);
    }

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
    const { name, category, icon, defaultUnit, barcode, searchNames, tags } = req.body;

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
    if (searchNames !== undefined) {
      updateData.searchNames = Array.isArray(searchNames) ? searchNames.map((n: string) => n.trim()).filter(Boolean) : [];
    }
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? tags.filter(Boolean).map((t: string) => new ObjectId(t)) : [];
    }

    const result = await db.collection('items').findOneAndUpdate(
      { _id: new ObjectId(id), itemType: 'global' },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({
        message: 'Global item not found',
        code: 'NOT_FOUND'
      });
    }

    // Update all group items that reference this global item
    const groupItemUpdateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) groupItemUpdateData.name = name.trim();
    if (category !== undefined) groupItemUpdateData.category = category.trim();
    if (icon !== undefined) groupItemUpdateData.icon = icon;
    if (defaultUnit !== undefined) groupItemUpdateData.defaultUnit = defaultUnit;
    if (barcode !== undefined) groupItemUpdateData.barcode = barcode;
    if (searchNames !== undefined) {
      groupItemUpdateData.searchNames = Array.isArray(searchNames) ? searchNames.map((n: string) => n.trim()).filter(Boolean) : [];
    }
    if (tags !== undefined) {
      groupItemUpdateData.tags = Array.isArray(tags) ? tags.filter(Boolean).map((t: string) => new ObjectId(t)) : [];
    }

    // Update all group items that reference this global item
    const updateResult = await db.collection('items').updateMany(
      { itemType: 'group', globalItemRef: new ObjectId(id) },
      { $set: groupItemUpdateData }
    );

    if (updateResult.modifiedCount > 0) {
      console.log(`Updated ${updateResult.modifiedCount} group items referencing global item "${result.name}"`);
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
    const result = await db.collection('items').updateOne(
      { _id: itemId, itemType: 'global' },
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
 *                 $ref: '#/components/schemas/Item'
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

    const groupItems = await db.collection('items')
      .find({ itemType: 'group', groupId: userGroup._id })
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
 *               $ref: '#/components/schemas/Item'
 *       403:
 *         description: Insufficient permissions
 */
router.post('/items/group', authMiddleware, requirePermission('group_items:create'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { name, category, icon, defaultUnit, barcode, searchNames, tags } = req.body;

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
      searchNames: Array.isArray(searchNames) ? searchNames.map((n: string) => n.trim()).filter(Boolean) : [],
      tags: Array.isArray(tags) ? tags.filter(Boolean).map((t: string) => new ObjectId(t)) : [],
      itemType: 'group',
      createdBy: new ObjectId(req.userId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('items').insertOne(newItem);
    const createdItem = await db.collection('items').findOne({ _id: result.insertedId });

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
    const { name, category, icon, defaultUnit, barcode, searchNames, tags } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid item ID',
        code: 'INVALID_ID'
      });
    }

    // Get user to find their active group
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'NOT_FOUND'
      });
    }

    // Use active group or find user's first group
    let groupId = user.activeGroupId;
    if (!groupId) {
      const userGroup = await db.collection('groups').findOne({
        'members.userId': new ObjectId(req.userId)
      });
      if (!userGroup) {
        return res.status(404).json({
          message: 'User has no group',
          code: 'NO_GROUP'
        });
      }
      groupId = userGroup._id;
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (icon !== undefined) updateData.icon = icon;
    if (defaultUnit !== undefined) updateData.defaultUnit = defaultUnit;
    if (barcode !== undefined) updateData.barcode = barcode;
    if (searchNames !== undefined) {
      updateData.searchNames = Array.isArray(searchNames) ? searchNames.map((n: string) => n.trim()).filter(Boolean) : [];
    }
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? tags.filter(Boolean).map((t: string) => new ObjectId(t)) : [];
    }

    const result = await db.collection('items').findOneAndUpdate(
      { _id: new ObjectId(id), itemType: 'group', groupId: groupId },
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

    // Get user to find their active group
    const user = await db.collection('users').findOne({
      _id: new ObjectId(req.userId)
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Use active group or find user's first group
    let groupId = user.activeGroupId;
    if (!groupId) {
      const userGroup = await db.collection('groups').findOne({
        'members.userId': new ObjectId(req.userId)
      });

      if (!userGroup) {
        return res.status(404).json({
          message: 'User has no group',
          code: 'NO_GROUP'
        });
      }
      groupId = userGroup._id;
    }

    const itemId = new ObjectId(id);

    const result = await db.collection('items').deleteOne({
      _id: itemId,
      itemType: 'group',
      groupId: groupId
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
        groupId: groupId
      }),
      db.collection('shopping').deleteMany({
        itemId: itemId,
        itemType: 'group',
        groupId: groupId
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
