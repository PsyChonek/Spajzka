import { Router, Response } from 'express';
import { getDatabase } from '../config/database';
import { ObjectId } from 'mongodb';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../rbac/middleware';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     PantryItem:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         groupId:
 *           type: string
 *         itemId:
 *           type: string
 *         itemType:
 *           type: string
 *           enum: [global, group]
 *         quantity:
 *           type: number
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
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreatePantryItemRequest:
 *       type: object
 *       properties:
 *         itemId:
 *           type: string
 *         itemType:
 *           type: string
 *           enum: [global, group]
 *         quantity:
 *           type: number
 *       required:
 *         - itemId
 *         - itemType
 *         - quantity
 */

/**
 * @openapi
 * /api/pantry:
 *   get:
 *     summary: Get all pantry items
 *     description: Retrieve all pantry items for the authenticated user's group
 *     tags:
 *       - Pantry
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of pantry items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PantryItem'
 */
router.get('/pantry', authMiddleware, async (req: AuthRequest, res: Response) => {
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
      }

      // Set this as the active group for future requests
      await db.collection('users').updateOne(
        { _id: new ObjectId(req.userId) },
        { $set: { activeGroupId: groupId } }
      );
    }

    // Fetch pantry items and populate item details using aggregation
    const pantryItems = await db.collection('pantry').aggregate([
      { $match: { groupId: groupId } },
      { $sort: { updatedAt: -1 } },
      {
        $lookup: {
          from: 'items',
          localField: 'itemId',
          foreignField: '_id',
          as: 'itemData'
        }
      },
      {
        $addFields: {
          item: { $arrayElemAt: ['$itemData', 0] }
        }
      },
      {
        $project: {
          itemData: 0
        }
      }
    ]).toArray();

    res.json(pantryItems.map(pantryItem => ({
      _id: pantryItem._id.toString(),
      groupId: pantryItem.groupId.toString(),
      itemId: pantryItem.itemId.toString(),
      itemType: pantryItem.itemType,
      quantity: pantryItem.quantity,
      createdAt: pantryItem.createdAt,
      updatedAt: pantryItem.updatedAt,
      // Include item details if found
      name: pantryItem.item?.name || 'Unknown Item',
      category: pantryItem.item?.category || '',
      icon: pantryItem.item?.icon || '',
      defaultUnit: pantryItem.item?.defaultUnit || 'pcs',
      barcode: pantryItem.item?.barcode || ''
    })));
  } catch (error) {
    console.error('Error fetching pantry items:', error);
    res.status(500).json({ message: 'Failed to fetch pantry items', code: 'FETCH_ERROR' });
  }
});

/**
 * @openapi
 * /api/pantry:
 *   post:
 *     summary: Create pantry item
 *     description: Add a new item to the pantry (requires pantry:create permission)
 *     tags:
 *       - Pantry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePantryItemRequest'
 *     responses:
 *       201:
 *         description: Item created
 */
router.post('/pantry', authMiddleware, requirePermission('pantry:create'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { itemId, itemType, quantity } = req.body;

    if (!itemId || !itemType || quantity === undefined) {
      return res.status(400).json({
        message: 'Missing required fields: itemId, itemType, quantity',
        code: 'VALIDATION_ERROR'
      });
    }

    if (!['global', 'group'].includes(itemType)) {
      return res.status(400).json({
        message: 'itemType must be "global" or "group"',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get user to find their active group
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
    if (!user || !user.activeGroupId) {
      return res.status(400).json({
        message: 'No active group set. Please set an active group first.',
        code: 'NO_ACTIVE_GROUP'
      });
    }

    // Verify item exists in the unified items collection
    const item = await db.collection('items').findOne({
      _id: new ObjectId(itemId),
      itemType: itemType
    });

    if (!item) {
      return res.status(404).json({
        message: `${itemType} item not found`,
        code: 'ITEM_NOT_FOUND'
      });
    }

    const newItem = {
      groupId: user.activeGroupId,
      itemId: new ObjectId(itemId),
      itemType,
      quantity,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('pantry').insertOne(newItem);

    // Fetch the created item with populated details
    const createdItems = await db.collection('pantry').aggregate([
      { $match: { _id: result.insertedId } },
      {
        $lookup: {
          from: 'items',
          localField: 'itemId',
          foreignField: '_id',
          as: 'itemData'
        }
      },
      {
        $addFields: {
          item: { $arrayElemAt: ['$itemData', 0] }
        }
      }
    ]).toArray();

    const createdItem = createdItems[0];

    res.status(201).json({
      _id: createdItem._id.toString(),
      groupId: createdItem.groupId.toString(),
      itemId: createdItem.itemId.toString(),
      itemType: createdItem.itemType,
      quantity: createdItem.quantity,
      createdAt: createdItem.createdAt,
      updatedAt: createdItem.updatedAt,
      name: createdItem.item?.name || 'Unknown Item',
      category: createdItem.item?.category || '',
      icon: createdItem.item?.icon || '',
      defaultUnit: createdItem.item?.defaultUnit || 'pcs',
      barcode: createdItem.item?.barcode || ''
    });
  } catch (error) {
    console.error('Error creating pantry item:', error);
    res.status(500).json({ message: 'Failed to create item', code: 'CREATE_ERROR' });
  }
});

/**
 * @openapi
 * /api/pantry/{id}:
 *   put:
 *     summary: Update pantry item
 *     description: Update an existing pantry item (requires pantry:update permission)
 *     tags:
 *       - Pantry
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
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Item updated
 */
router.put('/pantry/:id', authMiddleware, requirePermission('pantry:update'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { quantity } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID', code: 'INVALID_ID' });
    }

    // Get user to find their active group
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
    if (!user || !user.activeGroupId) {
      return res.status(400).json({
        message: 'No active group set',
        code: 'NO_ACTIVE_GROUP'
      });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (quantity !== undefined) updateData.quantity = quantity;

    const pantryItem = await db.collection('pantry').findOneAndUpdate(
      { _id: new ObjectId(id), groupId: user.activeGroupId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!pantryItem) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    res.json({
      ...pantryItem,
      _id: pantryItem._id.toString(),
      groupId: pantryItem.groupId.toString(),
      itemId: pantryItem.itemId.toString()
    });
  } catch (error) {
    console.error('Error updating pantry item:', error);
    res.status(500).json({ message: 'Failed to update item', code: 'UPDATE_ERROR' });
  }
});

/**
 * @openapi
 * /api/pantry/{id}:
 *   delete:
 *     summary: Delete pantry item
 *     description: Delete a pantry item (requires pantry:delete permission)
 *     tags:
 *       - Pantry
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
 *         description: Item deleted
 */
router.delete('/pantry/:id', authMiddleware, requirePermission('pantry:delete'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID', code: 'INVALID_ID' });
    }

    // Get user to find their active group
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
    if (!user || !user.activeGroupId) {
      return res.status(400).json({
        message: 'No active group set',
        code: 'NO_ACTIVE_GROUP'
      });
    }

    const result = await db.collection('pantry').deleteOne({
      _id: new ObjectId(id),
      groupId: user.activeGroupId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting pantry item:', error);
    res.status(500).json({ message: 'Failed to delete item', code: 'DELETE_ERROR' });
  }
});

export default router;
