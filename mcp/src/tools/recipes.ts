import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiRequest } from '../apiClient';
import { registerTool } from './helpers';
import { canConvert, convert } from '../../../shared/units';

const ingredientSchema = z.object({
  itemId: z.string().optional(),
  itemName: z.string(),
  quantity: z.number(),
  unit: z.string()
});

interface Recipe {
  _id: string;
  name: string;
  ingredients: Array<{
    itemId?: string;
    itemName: string;
    quantity: number;
    unit: string;
  }>;
}

interface PantryItem {
  itemId?: string;
  name?: string;
  quantity: number;
}

interface CatalogItem {
  _id: string;
  name: string;
  itemType: string;
  searchNames?: string[];
  unitType?: string;
  defaultUnit?: string;
}

export function registerRecipeTools(server: McpServer): void {
  registerTool(
    server,
    'list_recipes',
    "List all recipes available to a group: global recipes plus the group's own recipes, merged.",
    { groupId: z.string() },
    async ({ groupId }) => {
      const recipes = await apiRequest({
        method: 'GET',
        path: '/api/recipes',
        params: { groupId }
      });
      return { recipes };
    }
  );

  registerTool(
    server,
    'list_global_recipes',
    'List recipes from the global catalog.',
    {
      limit: z.number().int().positive().max(100).optional(),
      offset: z.number().int().nonnegative().optional()
    },
    async ({ limit, offset }) => {
      const recipes = await apiRequest({
        method: 'GET',
        path: '/api/recipes/global',
        params: { limit, offset }
      });
      return { recipes };
    }
  );

  registerTool(
    server,
    'list_group_recipes',
    "List a group's custom recipes.",
    { groupId: z.string() },
    async ({ groupId }) => {
      const recipes = await apiRequest({
        method: 'GET',
        path: '/api/recipes/group',
        params: { groupId }
      });
      return { recipes };
    }
  );

  registerTool(
    server,
    'create_group_recipe',
    'Create a new recipe in a group. Pass searchNames for localized/alternate labels (e.g. ["palačinky"] on a "Pancakes" recipe) so the recipe is findable in Czech or other languages.',
    {
      groupId: z.string(),
      name: z.string().min(1),
      description: z.string().optional(),
      icon: z.string().optional(),
      servings: z.number().positive(),
      ingredients: z.array(ingredientSchema),
      instructions: z.array(z.string()).min(1),
      tags: z.array(z.string()).optional(),
      searchNames: z.array(z.string()).optional()
    },
    async (args) => {
      return apiRequest({
        method: 'POST',
        path: '/api/recipes/group',
        body: args
      });
    }
  );

  registerTool(
    server,
    'update_group_recipe',
    'Update a group recipe. searchNames replaces the whole list of alternate search labels.',
    {
      groupId: z.string(),
      recipeId: z.string(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      icon: z.string().optional(),
      servings: z.number().positive().optional(),
      ingredients: z.array(ingredientSchema).optional(),
      instructions: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      searchNames: z.array(z.string()).optional()
    },
    async ({ groupId, recipeId, ...fields }) => {
      return apiRequest({
        method: 'PUT',
        path: `/api/recipes/group/${recipeId}`,
        body: { groupId, ...fields }
      });
    }
  );

  registerTool(
    server,
    'delete_group_recipe',
    'Delete a group recipe.',
    {
      groupId: z.string(),
      recipeId: z.string()
    },
    async ({ groupId, recipeId }) => {
      await apiRequest({
        method: 'DELETE',
        path: `/api/recipes/group/${recipeId}`,
        params: { groupId }
      });
      return { ok: true };
    }
  );

  registerTool(
    server,
    'add_recipe_ingredients_to_shopping',
    'Add every ingredient of a recipe to the group\'s shopping list. When missingOnly=true, only adds ingredients not already present in the pantry. Resolves ingredients without an itemId by matching against item names and searchNames (supports Czech/localized names). Returns { added, skipped } where skipped lists ingredient names that could not be matched to a catalog item.',
    {
      groupId: z.string(),
      recipeId: z.string(),
      missingOnly: z.boolean().optional()
    },
    async ({ groupId, recipeId, missingOnly = false }) => {
      const recipe = await apiRequest<Recipe>({
        method: 'GET',
        path: `/api/recipes/group/${recipeId}`,
        params: { groupId }
      });
      if (!recipe?.ingredients?.length) {
        return { added: [], skipped: [] };
      }

      // Fetch group + global items to resolve itemId and itemType
      const [groupItems, globalItems] = await Promise.all([
        apiRequest<CatalogItem[]>({ method: 'GET', path: '/api/items', params: { groupId } })
          .catch((): CatalogItem[] => []),
        apiRequest<CatalogItem[]>({ method: 'GET', path: '/api/items/global' })
          .catch((): CatalogItem[] => [])
      ]);

      const allItems = [...(Array.isArray(groupItems) ? groupItems : []), ...(Array.isArray(globalItems) ? globalItems : [])];

      // Build lookups: by _id and by normalized name / searchNames
      const itemById = new Map<string, CatalogItem>();
      const itemByName = new Map<string, CatalogItem>();
      for (const item of allItems) {
        itemById.set(item._id, item);
        const nameKey = item.name.toLowerCase().trim();
        if (!itemByName.has(nameKey)) itemByName.set(nameKey, item);
        for (const alias of item.searchNames ?? []) {
          const aliasKey = alias.toLowerCase().trim();
          if (!itemByName.has(aliasKey)) itemByName.set(aliasKey, item);
        }
      }

      let pantryItemIds = new Set<string>();
      if (missingOnly) {
        const pantry = (await apiRequest<PantryItem[]>({
          method: 'GET',
          path: '/api/pantry',
          params: { groupId }
        })) ?? [];
        pantryItemIds = new Set(pantry.map(p => p.itemId).filter((x): x is string => Boolean(x)));
      }

      const added: unknown[] = [];
      const skipped: string[] = [];

      for (const ing of recipe.ingredients) {
        const item = (ing.itemId ? itemById.get(ing.itemId) : undefined)
          ?? itemByName.get(ing.itemName.toLowerCase().trim());

        if (!item) {
          skipped.push(ing.itemName);
          continue;
        }

        if (missingOnly && pantryItemIds.has(item._id)) continue;

        // Convert ingredient quantity into the item's defaultUnit when possible.
        // For typed items (weight/volume/count/length) units are convertible;
        // for custom items we leave quantity as-is.
        let qty = ing.quantity;
        if (item.unitType && item.unitType !== 'custom' && item.defaultUnit && ing.unit && ing.unit !== item.defaultUnit) {
          if (canConvert(ing.unit, item.defaultUnit)) {
            qty = convert(ing.quantity, ing.unit, item.defaultUnit);
          }
        }

        try {
          const result = await apiRequest({
            method: 'POST',
            path: '/api/shopping',
            body: {
              groupId,
              itemId: item._id,
              itemType: item.itemType,
              quantity: qty
            }
          });
          added.push(result);
        } catch {
          skipped.push(ing.itemName);
        }
      }

      return { added, skipped };
    }
  );
}
