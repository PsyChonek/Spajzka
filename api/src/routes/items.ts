import { Router, Request, Response } from 'express';
import { getDatabase } from '../config/database';
import { ObjectId } from 'mongodb';

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
 *         unit:
 *           type: string
 *           description: Unit of measurement
 *         category:
 *           type: string
 *           description: Item category
 *         price:
 *           type: number
 *           description: Price per unit
 *         expiryDate:
 *           type: string
 *           format: date
 *           description: Expiry date
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       required:
 *         - name
 *         - unit
 *     CreateItemRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Item name
 *         unit:
 *           type: string
 *           description: Unit of measurement
 *         category:
 *           type: string
 *           description: Item category
 *         price:
 *           type: number
 *           description: Price per unit
 *         expiryDate:
 *           type: string
 *           format: date
 *           description: Expiry date
 *       required:
 *         - name
 *         - unit
 */

/**
 * @openapi
 * /api/items:
 *   get:
 *     summary: Get all items
 *     description: Retrieve a list of all items in the pantry
 *     tags:
 *       - Items
 *     responses:
 *       200:
 *         description: A list of items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/items', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const items = await db.collection('items').find().toArray();
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Failed to fetch items', code: 'FETCH_ERROR' });
  }
});

/**
 * @openapi
 * /api/items/{id}:
 *   get:
 *     summary: Get item by ID
 *     description: Retrieve a specific item by its ID
 *     tags:
 *       - Items
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/items/:id', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID', code: 'INVALID_ID' });
    }

    const item = await db.collection('items').findOne({ _id: new ObjectId(id) });

    if (!item) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ message: 'Failed to fetch item', code: 'FETCH_ERROR' });
  }
});

/**
 * @openapi
 * /api/items:
 *   post:
 *     summary: Create a new item
 *     description: Add a new item to the pantry
 *     tags:
 *       - Items
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateItemRequest'
 *     responses:
 *       201:
 *         description: Item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/items', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { name, unit, category, price, expiryDate } = req.body;

    const newItem = {
      name,
      unit,
      category: category || null,
      price: price || 0,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('items').insertOne(newItem);
    const createdItem = await db.collection('items').findOne({ _id: result.insertedId });

    res.status(201).json(createdItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Failed to create item', code: 'CREATE_ERROR' });
  }
});

/**
 * @openapi
 * /api/items/{id}:
 *   put:
 *     summary: Update an item
 *     description: Update an existing item by its ID
 *     tags:
 *       - Items
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateItemRequest'
 *     responses:
 *       200:
 *         description: Item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/items/:id', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { name, unit, category, price, expiryDate } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID', code: 'INVALID_ID' });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (unit !== undefined) updateData.unit = unit;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = price;
    if (expiryDate !== undefined) updateData.expiryDate = new Date(expiryDate);

    const result = await db.collection('items').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Failed to update item', code: 'UPDATE_ERROR' });
  }
});

/**
 * @openapi
 * /api/items/{id}:
 *   delete:
 *     summary: Delete an item
 *     description: Delete an item by its ID
 *     tags:
 *       - Items
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       204:
 *         description: Item deleted successfully
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/items/:id', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID', code: 'INVALID_ID' });
    }

    const result = await db.collection('items').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Failed to delete item', code: 'DELETE_ERROR' });
  }
});

export default router;
