import { Router, Response } from 'express';
import { getDatabase } from '../config/database';
import { ObjectId } from 'mongodb';
import { authMiddleware, AuthRequest } from '../middleware/auth';

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
 *           description: Item ID
 *         groupId:
 *           type: string
 *           description: Group ID
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
 *         price:
 *           type: number
 *           description: Price per unit
 *         category:
 *           type: string
 *           description: Item category
 *         expiryDate:
 *           type: string
 *           format: date
 *           description: Expiry date
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - name
 *         - quantity
 *     CreatePantryItemRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         quantity:
 *           type: number
 *         unit:
 *           type: string
 *         price:
 *           type: number
 *         category:
 *           type: string
 *         expiryDate:
 *           type: string
 *           format: date
 *       required:
 *         - name
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

    // Find user's group
    const group = await db.collection('groups').findOne({
      memberIds: new ObjectId(req.userId)
    });

    if (!group) {
      return res.status(404).json({
        message: 'User is not in any group',
        code: 'NOT_IN_GROUP'
      });
    }

    const pantryItems = await db.collection('pantry')
      .find({ groupId: group._id })
      .sort({ createdAt: -1 })
      .toArray();

    // Populate item details from items collection
    const enrichedItems = await Promise.all(
      pantryItems.map(async (pantryItem) => {
        const item = await db.collection('items').findOne({ _id: pantryItem.itemId });
        return {
          ...pantryItem,
          name: item?.name || 'Unknown',
          unit: item?.unit || 'pcs',
          category: item?.category || null
        };
      })
    );

    res.json(enrichedItems);
  } catch (error) {
    console.error('Error fetching pantry items:', error);
    res.status(500).json({ message: 'Failed to fetch pantry items', code: 'FETCH_ERROR' });
  }
});

/**
 * @openapi
 * /api/pantry/{id}:
 *   get:
 *     summary: Get pantry item by ID
 *     description: Retrieve a specific pantry item
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
 *       200:
 *         description: Pantry item found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PantryItem'
 *       404:
 *         description: Item not found
 */
router.get('/pantry/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID', code: 'INVALID_ID' });
    }

    // Find user's group
    const group = await db.collection('groups').findOne({
      memberIds: new ObjectId(req.userId)
    });

    if (!group) {
      return res.status(404).json({
        message: 'User is not in any group',
        code: 'NOT_IN_GROUP'
      });
    }

    const pantryItem = await db.collection('pantry').findOne({
      _id: new ObjectId(id),
      groupId: group._id
    });

    if (!pantryItem) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    // Populate item details from items collection
    const item = await db.collection('items').findOne({ _id: pantryItem.itemId });
    const enrichedItem = {
      ...pantryItem,
      name: item?.name || 'Unknown',
      unit: item?.unit || 'pcs',
      category: item?.category || null
    };

    res.json(enrichedItem);
  } catch (error) {
    console.error('Error fetching pantry item:', error);
    res.status(500).json({ message: 'Failed to fetch item', code: 'FETCH_ERROR' });
  }
});

/**
 * @openapi
 * /api/pantry:
 *   post:
 *     summary: Create pantry item
 *     description: Add a new item to the pantry
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PantryItem'
 */
router.post('/pantry', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { name, quantity, unit, price, category, expiryDate } = req.body;

    if (!name || quantity === undefined) {
      return res.status(400).json({
        message: 'Missing required fields: name, quantity',
        code: 'VALIDATION_ERROR'
      });
    }

    // Find user's group
    const group = await db.collection('groups').findOne({
      memberIds: new ObjectId(req.userId)
    });

    if (!group) {
      return res.status(404).json({
        message: 'User is not in any group',
        code: 'NOT_IN_GROUP'
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
        price: price || 0,
        expiryDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const commonResult = await db.collection('items').insertOne(newCommonItem);
      commonItem = await db.collection('items').findOne({ _id: commonResult.insertedId });
    }

    const newItem = {
      groupId: group._id,
      itemId: commonItem!._id,
      quantity,
      price: price || 0,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('pantry').insertOne(newItem);
    const createdPantryItem = await db.collection('pantry').findOne({ _id: result.insertedId });

    // Return enriched item with details from items collection
    const enrichedItem = {
      ...createdPantryItem,
      name: commonItem!.name,
      unit: commonItem!.unit,
      category: commonItem!.category
    };

    res.status(201).json(enrichedItem);
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
 *     description: Update an existing pantry item
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
 *             $ref: '#/components/schemas/CreatePantryItemRequest'
 *     responses:
 *       200:
 *         description: Item updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PantryItem'
 */
router.put('/pantry/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { quantity, price, expiryDate } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID', code: 'INVALID_ID' });
    }

    // Find user's group
    const group = await db.collection('groups').findOne({
      memberIds: new ObjectId(req.userId)
    });

    if (!group) {
      return res.status(404).json({
        message: 'User is not in any group',
        code: 'NOT_IN_GROUP'
      });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (quantity !== undefined) updateData.quantity = quantity;
    if (price !== undefined) updateData.price = price;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;

    const pantryItem = await db.collection('pantry').findOneAndUpdate(
      { _id: new ObjectId(id), groupId: group._id },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!pantryItem) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    // Populate item details from items collection
    const item = await db.collection('items').findOne({ _id: pantryItem.itemId });
    const enrichedItem = {
      ...pantryItem,
      name: item?.name || 'Unknown',
      unit: item?.unit || 'pcs',
      category: item?.category || null
    };

    res.json(enrichedItem);
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
 *     description: Delete a pantry item
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
router.delete('/pantry/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID', code: 'INVALID_ID' });
    }

    // Find user's group
    const group = await db.collection('groups').findOne({
      memberIds: new ObjectId(req.userId)
    });

    if (!group) {
      return res.status(404).json({
        message: 'User is not in any group',
        code: 'NOT_IN_GROUP'
      });
    }

    const result = await db.collection('pantry').deleteOne({
      _id: new ObjectId(id),
      groupId: group._id
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
