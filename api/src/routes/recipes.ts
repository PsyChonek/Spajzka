import { Router, Response } from 'express';
import { getDatabase } from '../config/database';
import { Db, ObjectId } from 'mongodb';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requirePermission, requireGlobalPermission } from '../rbac/middleware';
import { resolveGroupId, handleGroupResolutionError } from '../utils/resolveGroup';
import { logHistory, computeDiff } from '../utils/historyLog';
import { allowedUnits, isUnitAllowed, normaliseUnit } from '../../../shared/units';

const router = Router();

class IngredientUnitError extends Error {
  constructor(public readonly detail: string) {
    super(detail);
    this.name = 'IngredientUnitError';
  }
}

/** Resolve ingredient names + validate units against the referenced item's unitType. */
async function resolveIngredientNames(db: Db, ingredients: any[]): Promise<any[]> {
  const ids = ingredients
    .map((ing) => ing.itemId)
    .filter((id) => id && ObjectId.isValid(id))
    .map((id) => new ObjectId(id));
  const items = ids.length
    ? await db.collection('items').find({ _id: { $in: ids } }).toArray()
    : [];
  const itemById = new Map(items.map((i) => [i._id.toString(), i]));

  return ingredients.map((ing: any) => {
    const item = ing.itemId ? itemById.get(ing.itemId.toString()) : undefined;
    const itemName = item?.name ?? ing.itemName?.trim() ?? '';
    const rawUnit = (ing.unit ?? '').toString().trim();
    const unit = normaliseUnit(rawUnit) || rawUnit;
    if (item && item.unitType && item.unitType !== 'custom' && !isUnitAllowed(unit, item.unitType)) {
      throw new IngredientUnitError(
        `Ingredient "${itemName || rawUnit}" has unit "${rawUnit}" not valid for item unitType "${item.unitType}". Allowed: ${allowedUnits(item.unitType).join(', ')}`,
      );
    }
    return {
      itemId: ing.itemId || null,
      itemName,
      quantity: Number(ing.quantity),
      unit,
    };
  });
}

function handleIngredientUnitError(error: unknown, res: Response): boolean {
  if (error instanceof IngredientUnitError) {
    res.status(400).json({ message: error.detail, code: 'UNIT_VALIDATION_ERROR' });
    return true;
  }
  return false;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     RecipeIngredient:
 *       type: object
 *       properties:
 *         itemId:
 *           type: string
 *           description: Item ID reference (optional)
 *         itemName:
 *           type: string
 *           description: Name of the ingredient
 *         quantity:
 *           type: number
 *           description: Quantity of ingredient
 *         unit:
 *           type: string
 *           description: Unit of measurement
 *       required:
 *         - itemName
 *         - quantity
 *         - unit
 *     GlobalRecipe:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Recipe ID
 *         name:
 *           type: string
 *           description: Recipe name
 *         description:
 *           type: string
 *           description: Recipe description
 *         icon:
 *           type: string
 *           description: Emoji icon
 *         recipeType:
 *           type: string
 *           enum: [global]
 *           description: Recipe type
 *         userId:
 *           type: string
 *           description: User ID who created this recipe
 *         servings:
 *           type: number
 *           description: Number of servings
 *         ingredients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RecipeIngredient'
 *         instructions:
 *           type: array
 *           items:
 *             type: string
 *           description: Step-by-step instructions
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tag IDs associated with this recipe
 *         searchNames:
 *           type: array
 *           items:
 *             type: string
 *           description: Additional names for search (e.g. localized variants)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - name
 *         - recipeType
 *         - userId
 *         - servings
 *         - ingredients
 *         - instructions
 *     GroupRecipe:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Recipe ID
 *         name:
 *           type: string
 *           description: Recipe name
 *         description:
 *           type: string
 *           description: Recipe description
 *         icon:
 *           type: string
 *           description: Emoji icon
 *         recipeType:
 *           type: string
 *           enum: [group]
 *           description: Recipe type
 *         groupId:
 *           type: string
 *           description: Group ID this recipe belongs to
 *         userId:
 *           type: string
 *           description: User ID who created this recipe
 *         servings:
 *           type: number
 *           description: Number of servings
 *         ingredients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RecipeIngredient'
 *         instructions:
 *           type: array
 *           items:
 *             type: string
 *           description: Step-by-step instructions
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tag IDs associated with this recipe
 *         searchNames:
 *           type: array
 *           items:
 *             type: string
 *           description: Additional names for search (e.g. localized variants)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - name
 *         - recipeType
 *         - groupId
 *         - userId
 *         - servings
 *         - ingredients
 *         - instructions
 *     CreateGlobalRecipeRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         icon:
 *           type: string
 *         servings:
 *           type: number
 *         ingredients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RecipeIngredient'
 *         instructions:
 *           type: array
 *           items:
 *             type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tag IDs to associate with this recipe
 *         searchNames:
 *           type: array
 *           items:
 *             type: string
 *           description: Additional names for search (e.g. localized variants)
 *       required:
 *         - name
 *         - servings
 *         - ingredients
 *         - instructions
 *     CreateGroupRecipeRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         icon:
 *           type: string
 *         servings:
 *           type: number
 *         ingredients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RecipeIngredient'
 *         instructions:
 *           type: array
 *           items:
 *             type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tag IDs to associate with this recipe
 *         searchNames:
 *           type: array
 *           items:
 *             type: string
 *           description: Additional names for search (e.g. localized variants)
 *       required:
 *         - name
 *         - servings
 *         - ingredients
 *         - instructions
 */

/**
 * @openapi
 * /api/recipes:
 *   get:
 *     summary: Get all recipes
 *     description: Get group recipes for user's active group (global recipes are hidden and accessed through group recipes)
 *     tags:
 *       - Recipes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeGlobal
 *         schema:
 *           type: boolean
 *         description: Include global recipes (requires global_recipes:view permission)
 *     responses:
 *       200:
 *         description: List of recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GroupRecipe'
 */
router.get('/recipes', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const includeGlobal = req.query.includeGlobal === 'true';
    const groupId = await resolveGroupId(db, req, req.userId!);

    const groupRecipes = await db.collection('recipes')
      .find({
        recipeType: 'group',
        groupId
      })
      .toArray();

    // If user has permission and requests global recipes, include them
    if (includeGlobal) {
      // Check if user has permission to view global recipes
      const userWithRole = await db.collection('users').findOne(
        { _id: new ObjectId(req.userId) },
        { projection: { globalRoles: 1 } }
      );

      if (userWithRole?.globalRoles) {
        let hasPermission = false;
        for (const roleId of userWithRole.globalRoles) {
          const role = await db.collection('roles').findOne({ _id: roleId });
          if (role?.permissions?.includes('global_recipes:view')) {
            hasPermission = true;
            break;
          }
        }

        if (hasPermission) {
          const globalRecipes = await db.collection('recipes')
            .find({ recipeType: 'global' })
            .toArray();

          res.json({
            groupRecipes: groupRecipes.map(recipe => ({
              ...recipe,
              _id: recipe._id.toString(),
              groupId: recipe.groupId.toString(),
              userId: recipe.userId?.toString(),
              globalRecipeRef: recipe.globalRecipeRef?.toString(),
              type: 'group'
            })),
            globalRecipes: globalRecipes.map(recipe => ({
              ...recipe,
              _id: recipe._id.toString(),
              userId: recipe.userId?.toString(),
              type: 'global'
            }))
          });
          return;
        }
      }
    }

    // Default response: only group recipes
    res.json(groupRecipes.map(recipe => ({
      ...recipe,
      _id: recipe._id.toString(),
      groupId: recipe.groupId.toString(),
      userId: recipe.userId?.toString(),
      globalRecipeRef: recipe.globalRecipeRef?.toString(),
      type: 'group'
    })));
  } catch (error) {
    if (handleGroupResolutionError(error, res)) return;
    console.error('Error fetching recipes:', error);
    res.status(500).json({
      message: 'Failed to fetch recipes',
      code: 'FETCH_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/recipes/global:
 *   get:
 *     summary: Get global recipes
 *     description: Get all global recipes (requires global_recipes:create permission)
 *     tags:
 *       - Recipes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of global recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GlobalRecipe'
 */
router.get('/recipes/global', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const globalRecipes = await db.collection('recipes')
      .find({
        recipeType: 'global'
      })
      .toArray();

    res.json(globalRecipes.map(recipe => ({
      ...recipe,
      _id: recipe._id.toString(),
      userId: recipe.userId?.toString()
    })));
  } catch (error) {
    console.error('Error fetching global recipes:', error);
    res.status(500).json({
      message: 'Failed to fetch global recipes',
      code: 'FETCH_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/recipes/global:
 *   post:
 *     summary: Create global recipe
 *     description: Create a new global recipe (requires global_recipes:create permission)
 *     tags:
 *       - Recipes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGlobalRecipeRequest'
 *     responses:
 *       201:
 *         description: Global recipe created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GlobalRecipe'
 *       403:
 *         description: Insufficient permissions
 */
router.post('/recipes/global', authMiddleware, requireGlobalPermission('global_recipes:create'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { name, description, icon, servings, ingredients, instructions, tags, searchNames } = req.body;

    if (!name || !servings || !ingredients || !instructions) {
      return res.status(400).json({
        message: 'Missing required fields: name, servings, ingredients, instructions',
        code: 'VALIDATION_ERROR'
      });
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        message: 'Ingredients must be a non-empty array',
        code: 'VALIDATION_ERROR'
      });
    }

    if (!Array.isArray(instructions) || instructions.length === 0) {
      return res.status(400).json({
        message: 'Instructions must be a non-empty array',
        code: 'VALIDATION_ERROR'
      });
    }

    const newRecipe = {
      name: name.trim(),
      description: description?.trim() || null,
      icon: icon || null,
      recipeType: 'global',
      userId: new ObjectId(req.userId),
      servings: Number(servings),
      ingredients: await resolveIngredientNames(db, ingredients),
      instructions: instructions.map((inst: string) => inst.trim()),
      tags: Array.isArray(tags) ? tags.map((t: string) => new ObjectId(t)) : [],
      searchNames: Array.isArray(searchNames) ? searchNames.map((n: string) => n.trim()).filter(Boolean) : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('recipes').insertOne(newRecipe);
    const createdRecipe = await db.collection('recipes').findOne({ _id: result.insertedId });

    res.status(201).json({
      ...createdRecipe,
      _id: createdRecipe!._id.toString(),
      userId: createdRecipe!.userId?.toString()
    });
  } catch (error) {
    if (handleIngredientUnitError(error, res)) return;
    console.error('Error creating global recipe:', error);
    res.status(500).json({
      message: 'Failed to create global recipe',
      code: 'CREATE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/recipes/global/{id}:
 *   put:
 *     summary: Update global recipe
 *     description: Update a global recipe (requires global_recipes:update permission)
 *     tags:
 *       - Recipes
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
 *             $ref: '#/components/schemas/CreateGlobalRecipeRequest'
 *     responses:
 *       200:
 *         description: Global recipe updated
 *       403:
 *         description: Insufficient permissions
 */
router.put('/recipes/global/:id', authMiddleware, requireGlobalPermission('global_recipes:update'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { name, description, icon, servings, ingredients, instructions, tags, searchNames } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid recipe ID',
        code: 'INVALID_ID'
      });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (icon !== undefined) updateData.icon = icon;
    if (servings !== undefined) updateData.servings = Number(servings);
    if (ingredients !== undefined) {
      updateData.ingredients = await resolveIngredientNames(db, ingredients);
    }
    if (instructions !== undefined) {
      updateData.instructions = instructions.map((inst: string) => inst.trim());
    }
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? tags.map((t: string) => new ObjectId(t)) : [];
    }
    if (searchNames !== undefined) {
      updateData.searchNames = Array.isArray(searchNames)
        ? searchNames.map((n: string) => n.trim()).filter(Boolean)
        : [];
    }

    const result = await db.collection('recipes').findOneAndUpdate(
      {
        _id: new ObjectId(id),
        recipeType: 'global'
      },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({
        message: 'Global recipe not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      ...result,
      _id: result._id.toString(),
      userId: result.userId?.toString()
    });
  } catch (error) {
    if (handleIngredientUnitError(error, res)) return;
    console.error('Error updating global recipe:', error);
    res.status(500).json({
      message: 'Failed to update global recipe',
      code: 'UPDATE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/recipes/global/{id}:
 *   delete:
 *     summary: Delete global recipe
 *     description: Delete a global recipe (requires global_recipes:delete permission)
 *     tags:
 *       - Recipes
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
 *         description: Global recipe deleted
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/recipes/global/:id', authMiddleware, requireGlobalPermission('global_recipes:delete'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid recipe ID',
        code: 'INVALID_ID'
      });
    }

    const result = await db.collection('recipes').deleteOne({
      _id: new ObjectId(id),
      recipeType: 'global'
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: 'Global recipe not found',
        code: 'NOT_FOUND'
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting global recipe:', error);
    res.status(500).json({
      message: 'Failed to delete global recipe',
      code: 'DELETE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/recipes/group/{id}:
 *   get:
 *     summary: Get a single group recipe by ID
 *     tags:
 *       - Recipes
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
 *         description: Group recipe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GroupRecipe'
 *       404:
 *         description: Recipe not found
 */
router.get('/recipes/group/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid recipe ID', code: 'INVALID_ID' });
    }

    const groupId = await resolveGroupId(db, req, req.userId!);

    const recipe = await db.collection('recipes').findOne({
      _id: new ObjectId(id),
      recipeType: 'group',
      groupId
    });

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found', code: 'NOT_FOUND' });
    }

    res.json({
      ...recipe,
      _id: recipe._id.toString(),
      groupId: recipe.groupId.toString(),
      userId: recipe.userId?.toString()
    });
  } catch (error) {
    if (handleGroupResolutionError(error, res)) return;
    console.error('Error fetching group recipe:', error);
    res.status(500).json({ message: 'Failed to fetch recipe', code: 'FETCH_ERROR' });
  }
});

/**
 * @openapi
 * /api/recipes/group:
 *   get:
 *     summary: Get group recipes
 *     description: Get all recipes for user's active group
 *     tags:
 *       - Recipes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of group recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GroupRecipe'
 */
router.get('/recipes/group', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();

    const groupId = await resolveGroupId(db, req, req.userId!);

    const groupRecipes = await db.collection('recipes')
      .find({
        recipeType: 'group',
        groupId
      })
      .toArray();

    res.json(groupRecipes.map(recipe => ({
      ...recipe,
      _id: recipe._id.toString(),
      groupId: recipe.groupId.toString(),
      userId: recipe.userId?.toString()
    })));
  } catch (error) {
    if (handleGroupResolutionError(error, res)) return;
    console.error('Error fetching group recipes:', error);
    res.status(500).json({
      message: 'Failed to fetch group recipes',
      code: 'FETCH_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/recipes/group:
 *   post:
 *     summary: Create group recipe
 *     description: Create a new group-shared recipe (requires group_recipes:create permission)
 *     tags:
 *       - Recipes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGroupRecipeRequest'
 *     responses:
 *       201:
 *         description: Group recipe created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GroupRecipe'
 *       403:
 *         description: Insufficient permissions
 */
router.post('/recipes/group', authMiddleware, requirePermission('group_recipes:create'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { name, description, icon, servings, ingredients, instructions, tags, searchNames } = req.body;

    if (!name || !servings || !ingredients || !instructions) {
      return res.status(400).json({
        message: 'Missing required fields: name, servings, ingredients, instructions',
        code: 'VALIDATION_ERROR'
      });
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        message: 'Ingredients must be a non-empty array',
        code: 'VALIDATION_ERROR'
      });
    }

    if (!Array.isArray(instructions) || instructions.length === 0) {
      return res.status(400).json({
        message: 'Instructions must be a non-empty array',
        code: 'VALIDATION_ERROR'
      });
    }

    const groupId = await resolveGroupId(db, req, req.userId!);

    const newRecipe = {
      name: name.trim(),
      description: description?.trim() || null,
      icon: icon || null,
      recipeType: 'group',
      groupId,
      userId: new ObjectId(req.userId),
      servings: Number(servings),
      ingredients: await resolveIngredientNames(db, ingredients),
      instructions: instructions.map((inst: string) => inst.trim()),
      tags: Array.isArray(tags) ? tags.map((t: string) => new ObjectId(t)) : [],
      searchNames: Array.isArray(searchNames) ? searchNames.map((n: string) => n.trim()).filter(Boolean) : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('recipes').insertOne(newRecipe);
    const createdRecipe = await db.collection('recipes').findOne({ _id: result.insertedId });

    await logHistory(db, {
      groupId,
      userId: req.userId!,
      userEmail: req.userEmail,
      action: 'create',
      entityType: 'recipe',
      entityId: result.insertedId,
      entityName: newRecipe.name,
      changes: { after: { servings: newRecipe.servings, ingredientCount: newRecipe.ingredients.length } }
    });

    res.status(201).json({
      ...createdRecipe,
      _id: createdRecipe!._id.toString(),
      groupId: createdRecipe!.groupId.toString(),
      userId: createdRecipe!.userId?.toString()
    });
  } catch (error) {
    if (handleGroupResolutionError(error, res)) return;
    if (handleIngredientUnitError(error, res)) return;
    console.error('Error creating group recipe:', error);
    res.status(500).json({
      message: 'Failed to create group recipe',
      code: 'CREATE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/recipes/group/{id}:
 *   put:
 *     summary: Update group recipe
 *     description: Update a group recipe (requires group_recipes:update permission)
 *     tags:
 *       - Recipes
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
 *             $ref: '#/components/schemas/CreateGroupRecipeRequest'
 *     responses:
 *       200:
 *         description: Group recipe updated
 *       403:
 *         description: Insufficient permissions
 */
router.put('/recipes/group/:id', authMiddleware, requirePermission('group_recipes:update'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { name, description, icon, servings, ingredients, instructions, tags, searchNames } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid recipe ID',
        code: 'INVALID_ID'
      });
    }

    const groupId = await resolveGroupId(db, req, req.userId!);

    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (icon !== undefined) updateData.icon = icon;
    if (servings !== undefined) updateData.servings = Number(servings);
    if (ingredients !== undefined) {
      updateData.ingredients = await resolveIngredientNames(db, ingredients);
    }
    if (instructions !== undefined) {
      updateData.instructions = instructions.map((inst: string) => inst.trim());
    }
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? tags.map((t: string) => new ObjectId(t)) : [];
    }
    if (searchNames !== undefined) {
      updateData.searchNames = Array.isArray(searchNames)
        ? searchNames.map((n: string) => n.trim()).filter(Boolean)
        : [];
    }

    const before = await db.collection('recipes').findOne({
      _id: new ObjectId(id),
      recipeType: 'group',
      groupId
    });
    if (!before) {
      return res.status(404).json({
        message: 'Group recipe not found',
        code: 'NOT_FOUND'
      });
    }

    const result = await db.collection('recipes').findOneAndUpdate(
      {
        _id: new ObjectId(id),
        recipeType: 'group',
        groupId
      },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({
        message: 'Group recipe not found',
        code: 'NOT_FOUND'
      });
    }

    const diff = computeDiff(before, result, ['name', 'description', 'servings', 'ingredients', 'instructions', 'tags', 'icon']);
    if (diff) {
      await logHistory(db, {
        groupId,
        userId: req.userId!,
        userEmail: req.userEmail,
        action: 'update',
        entityType: 'recipe',
        entityId: result._id,
        entityName: result.name,
        changes: diff
      });
    }

    res.json({
      ...result,
      _id: result._id.toString(),
      groupId: result.groupId.toString(),
      userId: result.userId?.toString()
    });
  } catch (error) {
    if (handleGroupResolutionError(error, res)) return;
    if (handleIngredientUnitError(error, res)) return;
    console.error('Error updating group recipe:', error);
    res.status(500).json({
      message: 'Failed to update group recipe',
      code: 'UPDATE_ERROR'
    });
  }
});

/**
 * @openapi
 * /api/recipes/group/{id}:
 *   delete:
 *     summary: Delete group recipe
 *     description: Delete a group recipe (requires group_recipes:delete permission)
 *     tags:
 *       - Recipes
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
 *         description: Group recipe deleted
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/recipes/group/:id', authMiddleware, requirePermission('group_recipes:delete'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid recipe ID',
        code: 'INVALID_ID'
      });
    }

    const groupId = await resolveGroupId(db, req, req.userId!);

    const before = await db.collection('recipes').findOne({
      _id: new ObjectId(id),
      recipeType: 'group',
      groupId
    });
    if (!before) {
      return res.status(404).json({
        message: 'Group recipe not found',
        code: 'NOT_FOUND'
      });
    }

    const result = await db.collection('recipes').deleteOne({
      _id: new ObjectId(id),
      recipeType: 'group',
      groupId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: 'Group recipe not found',
        code: 'NOT_FOUND'
      });
    }

    await logHistory(db, {
      groupId,
      userId: req.userId!,
      userEmail: req.userEmail,
      action: 'delete',
      entityType: 'recipe',
      entityId: before._id,
      entityName: before.name,
      changes: { before: { servings: before.servings, ingredientCount: before.ingredients?.length ?? 0 } }
    });

    res.status(204).send();
  } catch (error) {
    if (handleGroupResolutionError(error, res)) return;
    console.error('Error deleting group recipe:', error);
    res.status(500).json({
      message: 'Failed to delete group recipe',
      code: 'DELETE_ERROR'
    });
  }
});

export default router;
