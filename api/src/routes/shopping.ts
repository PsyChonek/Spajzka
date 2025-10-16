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
 *     ShoppingItem:
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
 *         completed:
 *           type: boolean
 *         name:
 *           type: string
 *         category:
 *           type: string
 *         icon:
 *           type: string
 *         defaultUnit:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateShoppingItemRequest:
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
 */

/**
 * @openapi
 * /api/shopping:
 *   get:
 *     summary: Get all shopping items
 *     description: Retrieve all shopping list items for the authenticated user's group
 *     tags:
 *       - Shopping
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of shopping items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ShoppingItem'
 */
router.get('/shopping', authMiddleware, async (req: AuthRequest, res: Response) => {
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

    const shoppingItems = await db.collection('shopping')
      .find({ groupId: groupId })
      .sort({ completed: 1, updatedAt: -1 })
      .toArray();

    // Populate item details for each shopping item
    const populatedItems = await Promise.all(
      shoppingItems.map(async (item) => {
        // Fetch item details from the appropriate collection
        const collection = item.itemType === 'global' ? 'globalItems' : 'groupItems';
        const itemDetails = await db.collection(collection).findOne({ _id: item.itemId });

        return {
          ...item,
          _id: item._id.toString(),
          groupId: item.groupId.toString(),
          itemId: item.itemId.toString(),
          // Add item details if found
          name: itemDetails?.name || 'Unknown Item',
          category: itemDetails?.category,
          icon: itemDetails?.icon,
          defaultUnit: itemDetails?.defaultUnit
        };
      })
    );

    res.json(populatedItems);
  } catch (error) {
    console.error('Error fetching shopping items:', error);
    res.status(500).json({ message: 'Failed to fetch shopping items', code: 'FETCH_ERROR' });
  }
});

/**
 * @openapi
 * /api/shopping:
 *   post:
 *     summary: Create shopping item
 *     description: Add a new item to the shopping list (requires shopping:create permission)
 *     tags:
 *       - Shopping
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateShoppingItemRequest'
 *     responses:
 *       201:
 *         description: Item created
 */
router.post('/shopping', authMiddleware, requirePermission('shopping:create'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { itemId, itemType, quantity } = req.body;

    if (!itemId || !itemType) {
      return res.status(400).json({
        message: 'Missing required fields: itemId, itemType',
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

    // Verify item exists
    const collection = itemType === 'global' ? 'globalItems' : 'groupItems';
    const item = await db.collection(collection).findOne({ _id: new ObjectId(itemId) });

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
      quantity: quantity || 1,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('shopping').insertOne(newItem);
    const createdItem = await db.collection('shopping').findOne({ _id: result.insertedId });

    // Populate item details from the referenced item
    const itemDetails = await db.collection(collection).findOne({ _id: new ObjectId(itemId) });

    res.status(201).json({
      ...createdItem,
      _id: createdItem!._id.toString(),
      groupId: createdItem!.groupId.toString(),
      itemId: createdItem!.itemId.toString(),
      name: itemDetails?.name || 'Unknown Item',
      category: itemDetails?.category,
      icon: itemDetails?.icon,
      defaultUnit: itemDetails?.defaultUnit
    });
  } catch (error) {
    console.error('Error creating shopping item:', error);
    res.status(500).json({ message: 'Failed to create item', code: 'CREATE_ERROR' });
  }
});

/**
 * @openapi
 * /api/shopping/{id}:
 *   put:
 *     summary: Update shopping item
 *     description: Update an existing shopping item (requires shopping:update permission)
 *     tags:
 *       - Shopping
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
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Item updated
 */
router.put('/shopping/:id', authMiddleware, requirePermission('shopping:update'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { quantity, completed } = req.body;

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
    if (completed !== undefined) updateData.completed = completed;

    const shoppingItem = await db.collection('shopping').findOneAndUpdate(
      { _id: new ObjectId(id), groupId: user.activeGroupId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!shoppingItem) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    // Populate item details from the referenced item
    const itemCollection = shoppingItem.itemType === 'global' ? 'globalItems' : 'groupItems';
    const itemDetails = await db.collection(itemCollection).findOne({ _id: shoppingItem.itemId });

    res.json({
      ...shoppingItem,
      _id: shoppingItem._id.toString(),
      groupId: shoppingItem.groupId.toString(),
      itemId: shoppingItem.itemId.toString(),
      name: itemDetails?.name || 'Unknown Item',
      category: itemDetails?.category,
      icon: itemDetails?.icon,
      defaultUnit: itemDetails?.defaultUnit
    });
  } catch (error) {
    console.error('Error updating shopping item:', error);
    res.status(500).json({ message: 'Failed to update item', code: 'UPDATE_ERROR' });
  }
});

/**
 * @openapi
 * /api/shopping/{id}:
 *   delete:
 *     summary: Delete shopping item
 *     description: Delete a shopping item (requires shopping:delete permission)
 *     tags:
 *       - Shopping
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
router.delete('/shopping/:id', authMiddleware, requirePermission('shopping:delete'), async (req: AuthRequest, res: Response) => {
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

    const result = await db.collection('shopping').deleteOne({
      _id: new ObjectId(id),
      groupId: user.activeGroupId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting shopping item:', error);
    res.status(500).json({ message: 'Failed to delete item', code: 'DELETE_ERROR' });
  }
});

export default router;
