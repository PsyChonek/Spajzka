import { Router, Response } from 'express';
import { getDatabase } from '../config/database';
import { ObjectId } from 'mongodb';
import { authMiddleware, AuthRequest } from '../middleware/auth';

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
 *           description: Item ID
 *         userId:
 *           type: string
 *           description: Owner user ID
 *         itemId:
 *           type: string
 *           description: Reference to common item ID
 *         name:
 *           type: string
 *           description: Item name
 *         quantity:
 *           type: number
 *           description: Item quantity
 *         unit:
 *           type: string
 *           description: Unit of measurement
 *         completed:
 *           type: boolean
 *           description: Whether item is completed
 *         category:
 *           type: string
 *           description: Item category
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - name
 *     CreateShoppingItemRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         quantity:
 *           type: number
 *         unit:
 *           type: string
 *         category:
 *           type: string
 *       required:
 *         - name
 */

/**
 * @openapi
 * /api/shopping:
 *   get:
 *     summary: Get all shopping items
 *     description: Retrieve all shopping list items for the authenticated user
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
    const shoppingItems = await db.collection('shopping')
      .find({ userId: new ObjectId(req.userId) })
      .sort({ completed: 1, createdAt: -1 })
      .toArray();

    // Populate item details from items collection
    const enrichedItems = await Promise.all(
      shoppingItems.map(async (shoppingItem) => {
        const item = await db.collection('items').findOne({ _id: shoppingItem.itemId });
        return {
          ...shoppingItem,
          name: item?.name || 'Unknown',
          unit: item?.unit || 'pcs',
          category: item?.category || null
        };
      })
    );

    res.json(enrichedItems);
  } catch (error) {
    console.error('Error fetching shopping items:', error);
    res.status(500).json({ message: 'Failed to fetch shopping items', code: 'FETCH_ERROR' });
  }
});

/**
 * @openapi
 * /api/shopping/{id}:
 *   get:
 *     summary: Get shopping item by ID
 *     description: Retrieve a specific shopping item
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
 *       200:
 *         description: Shopping item found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShoppingItem'
 */
router.get('/shopping/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID', code: 'INVALID_ID' });
    }

    const shoppingItem = await db.collection('shopping').findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(req.userId)
    });

    if (!shoppingItem) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    // Populate item details from items collection
    const item = await db.collection('items').findOne({ _id: shoppingItem.itemId });
    const enrichedItem = {
      ...shoppingItem,
      name: item?.name || 'Unknown',
      unit: item?.unit || 'pcs',
      category: item?.category || null
    };

    res.json(enrichedItem);
  } catch (error) {
    console.error('Error fetching shopping item:', error);
    res.status(500).json({ message: 'Failed to fetch item', code: 'FETCH_ERROR' });
  }
});

/**
 * @openapi
 * /api/shopping:
 *   post:
 *     summary: Create shopping item
 *     description: Add a new item to the shopping list
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShoppingItem'
 */
router.post('/shopping', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { name, quantity, unit, category } = req.body;

    if (!name) {
      return res.status(400).json({
        message: 'Missing required field: name',
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if common item exists, if not create it
    let commonItem = await db.collection('items').findOne({ name: name.trim() });

    if (!commonItem) {
      const newCommonItem = {
        name: name.trim(),
        quantity: 0,
        unit: unit || 'pcs',
        category: category || null,
        price: 0,
        expiryDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const commonResult = await db.collection('items').insertOne(newCommonItem);
      commonItem = await db.collection('items').findOne({ _id: commonResult.insertedId });
    }

    const newItem = {
      userId: new ObjectId(req.userId),
      itemId: commonItem!._id,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('shopping').insertOne(newItem);
    const createdShoppingItem = await db.collection('shopping').findOne({ _id: result.insertedId });

    // Return enriched item with details from items collection
    const enrichedItem = {
      ...createdShoppingItem,
      name: commonItem!.name,
      unit: commonItem!.unit,
      category: commonItem!.category
    };

    res.status(201).json(enrichedItem);
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
 *     description: Update an existing shopping item
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
 *               name:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               completed:
 *                 type: boolean
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShoppingItem'
 */
router.put('/shopping/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { completed } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID', code: 'INVALID_ID' });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (completed !== undefined) updateData.completed = completed;

    const shoppingItem = await db.collection('shopping').findOneAndUpdate(
      { _id: new ObjectId(id), userId: new ObjectId(req.userId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!shoppingItem) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    // Populate item details from items collection
    const item = await db.collection('items').findOne({ _id: shoppingItem.itemId });
    const enrichedItem = {
      ...shoppingItem,
      name: item?.name || 'Unknown',
      unit: item?.unit || 'pcs',
      category: item?.category || null
    };

    res.json(enrichedItem);
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
 *     description: Delete a shopping item
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
router.delete('/shopping/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID', code: 'INVALID_ID' });
    }

    const result = await db.collection('shopping').deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(req.userId)
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
