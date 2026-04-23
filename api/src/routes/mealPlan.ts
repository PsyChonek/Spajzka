import { Router, Response } from 'express';
import { getDatabase } from '../config/database';
import { ObjectId } from 'mongodb';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requirePermission, getUserPermissions } from '../rbac/middleware';
import { hasPermission } from '../rbac/permissions';
import { resolveGroupId, handleGroupResolutionError } from '../utils/resolveGroup';
import { aggregateMealPlanShopping } from '../utils/mealPlanAggregator';
import { insertShoppingItem } from '../utils/shoppingHelpers';

const router = Router();

// ---------------------------------------------------------------------------
// OpenAPI component schemas
// ---------------------------------------------------------------------------

/**
 * @openapi
 * components:
 *   schemas:
 *     MealPlanEntry:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         groupId:
 *           type: string
 *         recipeId:
 *           type: string
 *         recipeType:
 *           type: string
 *           enum: [global, group]
 *         recipeName:
 *           type: string
 *           description: Denormalized snapshot of recipe name at creation time
 *         cookDate:
 *           type: string
 *           format: date-time
 *         servings:
 *           type: number
 *         eatDates:
 *           type: array
 *           items:
 *             type: string
 *             format: date-time
 *         mealType:
 *           type: string
 *           description: Free-form label e.g. "dinner", "lunch"
 *         notes:
 *           type: string
 *         shoppingGeneratedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         shoppingBatchId:
 *           type: string
 *           nullable: true
 *         createdBy:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateMealPlanEntryRequest:
 *       type: object
 *       required:
 *         - recipeId
 *         - recipeType
 *         - cookDate
 *       properties:
 *         recipeId:
 *           type: string
 *         recipeType:
 *           type: string
 *           enum: [global, group]
 *         cookDate:
 *           type: string
 *           format: date-time
 *         servings:
 *           type: number
 *           description: Defaults to recipe.servings if omitted
 *         eatDates:
 *           type: array
 *           items:
 *             type: string
 *             format: date-time
 *           description: Defaults to [cookDate] if omitted
 *         mealType:
 *           type: string
 *         notes:
 *           type: string
 *         groupId:
 *           type: string
 *           description: Optional override; defaults to active group
 *     UpdateMealPlanEntryRequest:
 *       type: object
 *       properties:
 *         cookDate:
 *           type: string
 *           format: date-time
 *         servings:
 *           type: number
 *         eatDates:
 *           type: array
 *           items:
 *             type: string
 *             format: date-time
 *         mealType:
 *           type: string
 *         notes:
 *           type: string
 *         groupId:
 *           type: string
 *     AggregatedIngredient:
 *       type: object
 *       properties:
 *         itemId:
 *           type: string
 *         itemType:
 *           type: string
 *           enum: [global, group]
 *         itemName:
 *           type: string
 *         unit:
 *           type: string
 *         quantity:
 *           type: number
 *         inPantry:
 *           type: number
 *         toAdd:
 *           type: number
 *         icon:
 *           type: string
 *         category:
 *           type: string
 *         defaultUnit:
 *           type: string
 *     ShoppingPreviewRequest:
 *       type: object
 *       required:
 *         - from
 *         - to
 *       properties:
 *         groupId:
 *           type: string
 *         from:
 *           type: string
 *           format: date-time
 *         to:
 *           type: string
 *           format: date-time
 *         missingOnly:
 *           type: boolean
 *           default: true
 *     GenerateShoppingRequest:
 *       type: object
 *       required:
 *         - from
 *         - to
 *       properties:
 *         groupId:
 *           type: string
 *         from:
 *           type: string
 *           format: date-time
 *         to:
 *           type: string
 *           format: date-time
 *         missingOnly:
 *           type: boolean
 *           default: true
 *     ShoppingPreviewResponse:
 *       type: object
 *       properties:
 *         aggregated:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AggregatedIngredient'
 *         skippedFreeText:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               recipeId:
 *                 type: string
 *               recipeName:
 *                 type: string
 *               itemName:
 *                 type: string
 *     GenerateShoppingResponse:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *         batchId:
 *           type: string
 *         addedCount:
 *           type: number
 *         skippedFreeText:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               recipeId:
 *                 type: string
 *               recipeName:
 *                 type: string
 *               itemName:
 *                 type: string
 *         aggregated:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AggregatedIngredient'
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function serializeEntry(doc: any): object {
  return {
    ...doc,
    _id: doc._id.toString(),
    groupId: doc.groupId.toString(),
    recipeId: doc.recipeId.toString(),
    createdBy: doc.createdBy.toString(),
    cookDate: doc.cookDate instanceof Date ? doc.cookDate.toISOString() : doc.cookDate,
    eatDates: (doc.eatDates ?? []).map((d: any) =>
      d instanceof Date ? d.toISOString() : d
    ),
    shoppingGeneratedAt: doc.shoppingGeneratedAt
      ? (doc.shoppingGeneratedAt instanceof Date
        ? doc.shoppingGeneratedAt.toISOString()
        : doc.shoppingGeneratedAt)
      : null,
    shoppingBatchId: doc.shoppingBatchId ?? null
  };
}

// ---------------------------------------------------------------------------
// GET /api/meal-plan — list entries in date range
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/meal-plan:
 *   get:
 *     summary: Get meal-plan entries
 *     description: Retrieve meal-plan entries for the group within an optional date range
 *     tags:
 *       - Meal Plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start of date range (inclusive, ISO date)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End of date range (inclusive, ISO date)
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *         description: Optional group override
 *     responses:
 *       200:
 *         description: List of meal-plan entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MealPlanEntry'
 *       401:
 *         description: Unauthorized
 */
router.get('/meal-plan', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const groupId = await resolveGroupId(db, req, req.userId!);

    const filter: any = { groupId };

    const { from, to } = req.query as Record<string, string>;
    if (from || to) {
      filter.cookDate = {};
      if (from) {
        const fromDate = new Date(from);
        if (isNaN(fromDate.getTime())) {
          return res.status(400).json({ message: 'Invalid "from" date', code: 'VALIDATION_ERROR' });
        }
        filter.cookDate.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (isNaN(toDate.getTime())) {
          return res.status(400).json({ message: 'Invalid "to" date', code: 'VALIDATION_ERROR' });
        }
        filter.cookDate.$lte = toDate;
      }
    }

    const entries = await db.collection('mealPlan')
      .find(filter)
      .sort({ cookDate: 1 })
      .toArray();

    res.json(entries.map(serializeEntry));
  } catch (error) {
    if (handleGroupResolutionError(error, res)) return;
    console.error('Error fetching meal-plan entries:', error);
    res.status(500).json({ message: 'Failed to fetch meal-plan entries', code: 'FETCH_ERROR' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/meal-plan — create entry
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/meal-plan:
 *   post:
 *     summary: Create a meal-plan entry
 *     description: Schedule a recipe on a specific cook date (requires meal_plan:create permission)
 *     tags:
 *       - Meal Plan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMealPlanEntryRequest'
 *     responses:
 *       201:
 *         description: Meal-plan entry created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MealPlanEntry'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Recipe not found
 */
router.post(
  '/meal-plan',
  authMiddleware,
  requirePermission('meal_plan:create'),
  async (req: AuthRequest, res: Response) => {
    try {
      const db = getDatabase();
      const { recipeId, recipeType, cookDate, servings, eatDates, mealType, notes } = req.body;

      if (!recipeId || !recipeType || !cookDate) {
        return res.status(400).json({
          message: 'Missing required fields: recipeId, recipeType, cookDate',
          code: 'VALIDATION_ERROR'
        });
      }

      if (!['global', 'group'].includes(recipeType)) {
        return res.status(400).json({
          message: 'recipeType must be "global" or "group"',
          code: 'VALIDATION_ERROR'
        });
      }

      if (!ObjectId.isValid(recipeId)) {
        return res.status(400).json({ message: 'Invalid recipeId', code: 'INVALID_ID' });
      }

      const cookDateParsed = new Date(cookDate);
      if (isNaN(cookDateParsed.getTime())) {
        return res.status(400).json({ message: 'Invalid cookDate', code: 'VALIDATION_ERROR' });
      }

      const groupId = await resolveGroupId(db, req, req.userId!);

      // Look up the recipe to snapshot recipeName and default servings
      const recipeQuery: any = { _id: new ObjectId(recipeId) };
      if (recipeType === 'group') {
        recipeQuery.groupId = groupId;
      } else {
        recipeQuery.recipeType = 'global';
      }

      const recipe = await db.collection('recipes').findOne(recipeQuery);
      if (!recipe) {
        return res.status(404).json({ message: 'Recipe not found', code: 'NOT_FOUND' });
      }

      const effectiveServings = servings != null ? Number(servings) : recipe.servings;

      // eatDates defaults to [cookDate] if not provided
      let parsedEatDates: Date[];
      if (Array.isArray(eatDates) && eatDates.length > 0) {
        parsedEatDates = eatDates.map((d: string) => {
          const dt = new Date(d);
          if (isNaN(dt.getTime())) {
            throw Object.assign(new Error(`Invalid eatDate: ${d}`), { statusCode: 400, code: 'VALIDATION_ERROR' });
          }
          return dt;
        });
      } else {
        parsedEatDates = [cookDateParsed];
      }

      const now = new Date();
      const newEntry = {
        groupId,
        recipeId: new ObjectId(recipeId),
        recipeType,
        recipeName: recipe.name,
        cookDate: cookDateParsed,
        servings: effectiveServings,
        eatDates: parsedEatDates,
        mealType: mealType?.trim() || undefined,
        notes: notes?.trim() || undefined,
        shoppingGeneratedAt: null,
        shoppingBatchId: null,
        createdBy: new ObjectId(req.userId!),
        createdAt: now,
        updatedAt: now
      };

      const result = await db.collection('mealPlan').insertOne(newEntry);
      const created = await db.collection('mealPlan').findOne({ _id: result.insertedId });

      res.status(201).json(serializeEntry(created!));
    } catch (error: any) {
      if (handleGroupResolutionError(error, res)) return;
      if (error.statusCode === 400) {
        return res.status(400).json({ message: error.message, code: error.code ?? 'VALIDATION_ERROR' });
      }
      console.error('Error creating meal-plan entry:', error);
      res.status(500).json({ message: 'Failed to create meal-plan entry', code: 'CREATE_ERROR' });
    }
  }
);

// ---------------------------------------------------------------------------
// PATCH /api/meal-plan/:id — update entry
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/meal-plan/{id}:
 *   patch:
 *     summary: Update a meal-plan entry
 *     description: Partially update a scheduled meal (requires meal_plan:update permission)
 *     tags:
 *       - Meal Plan
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
 *             $ref: '#/components/schemas/UpdateMealPlanEntryRequest'
 *     responses:
 *       200:
 *         description: Updated meal-plan entry
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MealPlanEntry'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Entry not found
 */
router.patch(
  '/meal-plan/:id',
  authMiddleware,
  requirePermission('meal_plan:update'),
  async (req: AuthRequest, res: Response) => {
    try {
      const db = getDatabase();
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid entry ID', code: 'INVALID_ID' });
      }

      const groupId = await resolveGroupId(db, req, req.userId!);

      const { cookDate, servings, eatDates, mealType, notes } = req.body;
      const updateData: any = { updatedAt: new Date() };

      if (cookDate !== undefined) {
        const d = new Date(cookDate);
        if (isNaN(d.getTime())) {
          return res.status(400).json({ message: 'Invalid cookDate', code: 'VALIDATION_ERROR' });
        }
        updateData.cookDate = d;
      }

      if (servings !== undefined) {
        updateData.servings = Number(servings);
      }

      if (eatDates !== undefined) {
        if (!Array.isArray(eatDates)) {
          return res.status(400).json({ message: 'eatDates must be an array', code: 'VALIDATION_ERROR' });
        }
        updateData.eatDates = eatDates.map((d: string) => {
          const dt = new Date(d);
          if (isNaN(dt.getTime())) {
            throw Object.assign(new Error(`Invalid eatDate: ${d}`), { statusCode: 400, code: 'VALIDATION_ERROR' });
          }
          return dt;
        });
      }

      if (mealType !== undefined) updateData.mealType = mealType?.trim() || undefined;
      if (notes !== undefined) updateData.notes = notes?.trim() || undefined;

      const updated = await db.collection('mealPlan').findOneAndUpdate(
        { _id: new ObjectId(id), groupId },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!updated) {
        return res.status(404).json({ message: 'Meal-plan entry not found', code: 'NOT_FOUND' });
      }

      res.json(serializeEntry(updated));
    } catch (error: any) {
      if (handleGroupResolutionError(error, res)) return;
      if (error.statusCode === 400) {
        return res.status(400).json({ message: error.message, code: error.code ?? 'VALIDATION_ERROR' });
      }
      console.error('Error updating meal-plan entry:', error);
      res.status(500).json({ message: 'Failed to update meal-plan entry', code: 'UPDATE_ERROR' });
    }
  }
);

// ---------------------------------------------------------------------------
// DELETE /api/meal-plan/:id — delete entry
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/meal-plan/{id}:
 *   delete:
 *     summary: Delete a meal-plan entry
 *     description: >
 *       Delete a scheduled meal (requires meal_plan:delete permission).
 *       Pass `removeShoppingItems: true` in the request body to also delete
 *       shopping items linked to this entry's batch — the user must also hold
 *       `shopping:delete` permission for this to succeed.
 *     tags:
 *       - Meal Plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               removeShoppingItems:
 *                 type: boolean
 *                 default: false
 *               groupId:
 *                 type: string
 *     responses:
 *       204:
 *         description: Entry deleted
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Entry not found
 */
router.delete(
  '/meal-plan/:id',
  authMiddleware,
  requirePermission('meal_plan:delete'),
  async (req: AuthRequest, res: Response) => {
    try {
      const db = getDatabase();
      const { id } = req.params;
      const { removeShoppingItems } = req.body ?? {};

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid entry ID', code: 'INVALID_ID' });
      }

      const groupId = await resolveGroupId(db, req, req.userId!);

      const entry = await db.collection('mealPlan').findOne({
        _id: new ObjectId(id),
        groupId
      });

      if (!entry) {
        return res.status(404).json({ message: 'Meal-plan entry not found', code: 'NOT_FOUND' });
      }

      // If caller wants to cascade-delete shopping items, verify permission first
      if (removeShoppingItems && entry.shoppingBatchId) {
        const perms = await getUserPermissions(req.userId!, groupId.toString());
        if (!hasPermission(perms, 'shopping:delete')) {
          return res.status(403).json({
            message: 'Permission denied. Required: shopping:delete',
            code: 'INSUFFICIENT_PERMISSIONS'
          });
        }
        await db.collection('shopping').deleteMany({
          groupId,
          'mealPlanRefs.batchId': entry.shoppingBatchId
        });
      }

      await db.collection('mealPlan').deleteOne({ _id: new ObjectId(id), groupId });

      res.status(204).send();
    } catch (error) {
      if (handleGroupResolutionError(error, res)) return;
      console.error('Error deleting meal-plan entry:', error);
      res.status(500).json({ message: 'Failed to delete meal-plan entry', code: 'DELETE_ERROR' });
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/meal-plan/shopping-preview — dry-run aggregation
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/meal-plan/shopping-preview:
 *   post:
 *     summary: Preview shopping list from meal plan
 *     description: Dry-run that aggregates ingredients for scheduled meals in a date range without mutating any data
 *     tags:
 *       - Meal Plan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShoppingPreviewRequest'
 *     responses:
 *       200:
 *         description: Aggregated ingredient list (preview only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShoppingPreviewResponse'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Unauthorized
 */
router.post('/meal-plan/shopping-preview', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { from, to, missingOnly } = req.body;

    if (!from || !to) {
      return res.status(400).json({
        message: 'Missing required fields: from, to',
        code: 'VALIDATION_ERROR'
      });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({ message: 'Invalid from or to date', code: 'VALIDATION_ERROR' });
    }

    const groupId = await resolveGroupId(db, req, req.userId!);

    const result = await aggregateMealPlanShopping(db, groupId, fromDate, toDate, {
      missingOnly: missingOnly !== false
    });

    res.json({
      aggregated: result.aggregated,
      skippedFreeText: result.skippedFreeText
    });
  } catch (error) {
    if (handleGroupResolutionError(error, res)) return;
    console.error('Error generating shopping preview:', error);
    res.status(500).json({ message: 'Failed to generate shopping preview', code: 'PREVIEW_ERROR' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/meal-plan/generate-shopping — materialize shopping items
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/meal-plan/generate-shopping:
 *   post:
 *     summary: Generate shopping list from meal plan
 *     description: >
 *       Aggregates ingredients for scheduled meals in a date range and inserts
 *       them into the shopping collection (requires shopping:create permission).
 *       Also stamps shoppingGeneratedAt and shoppingBatchId on the affected meal-plan entries.
 *     tags:
 *       - Meal Plan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateShoppingRequest'
 *     responses:
 *       200:
 *         description: Shopping items created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenerateShoppingResponse'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/meal-plan/generate-shopping',
  authMiddleware,
  requirePermission('shopping:create'),
  async (req: AuthRequest, res: Response) => {
    try {
      const db = getDatabase();
      const { from, to, missingOnly } = req.body;

      if (!from || !to) {
        return res.status(400).json({
          message: 'Missing required fields: from, to',
          code: 'VALIDATION_ERROR'
        });
      }

      const fromDate = new Date(from);
      const toDate = new Date(to);
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({ message: 'Invalid from or to date', code: 'VALIDATION_ERROR' });
      }

      const groupId = await resolveGroupId(db, req, req.userId!);

      const { aggregated, skippedFreeText, entryIds } = await aggregateMealPlanShopping(
        db,
        groupId,
        fromDate,
        toDate,
        { missingOnly: missingOnly !== false }
      );

      const batchId = new ObjectId().toString();
      let addedCount = 0;

      for (const row of aggregated) {
        if (row.toAdd <= 0) continue;

        await insertShoppingItem(db, groupId, {
          itemId: row.itemId,
          itemType: row.itemType,
          quantity: row.toAdd,
          mealPlanRef: { batchId }
        });
        addedCount++;
      }

      // Stamp shoppingGeneratedAt and batchId on all meal-plan entries in the range
      if (entryIds.length > 0) {
        await db.collection('mealPlan').updateMany(
          { _id: { $in: entryIds.map(id => new ObjectId(id)) } },
          { $set: { shoppingGeneratedAt: new Date(), shoppingBatchId: batchId } }
        );
      }

      res.json({
        ok: true,
        batchId,
        addedCount,
        skippedFreeText,
        aggregated
      });
    } catch (error) {
      if (handleGroupResolutionError(error, res)) return;
      console.error('Error generating shopping list from meal plan:', error);
      res.status(500).json({ message: 'Failed to generate shopping list', code: 'GENERATE_ERROR' });
    }
  }
);

export default router;
