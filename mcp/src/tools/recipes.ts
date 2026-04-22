import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiRequest } from '../apiClient';
import { registerTool } from './helpers';

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

export function registerRecipeTools(server: McpServer): void {
  registerTool(
    server,
    'list_recipes',
    "List all recipes available to a group: global recipes plus the group's own recipes, merged.",
    { groupId: z.string() },
    async ({ groupId }) => {
      return apiRequest({
        method: 'GET',
        path: '/api/recipes',
        params: { groupId }
      });
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
      return apiRequest({
        method: 'GET',
        path: '/api/recipes/global',
        params: { limit, offset }
      });
    }
  );

  registerTool(
    server,
    'list_group_recipes',
    "List a group's custom recipes.",
    { groupId: z.string() },
    async ({ groupId }) => {
      return apiRequest({
        method: 'GET',
        path: '/api/recipes/group',
        params: { groupId }
      });
    }
  );

  registerTool(
    server,
    'create_group_recipe',
    'Create a new recipe in a group.',
    {
      groupId: z.string(),
      name: z.string().min(1),
      description: z.string().optional(),
      icon: z.string().optional(),
      ingredients: z.array(ingredientSchema),
      instructions: z.array(z.string()).optional()
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
    'Update a group recipe.',
    {
      groupId: z.string(),
      recipeId: z.string(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      icon: z.string().optional(),
      ingredients: z.array(ingredientSchema).optional(),
      instructions: z.array(z.string()).optional()
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
    'Add every ingredient of a recipe to the group\'s shopping list. When missingOnly=true, only adds ingredients not already present (by itemId) in the pantry.',
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
      if (!recipe) {
        return { added: [] };
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
      for (const ing of recipe.ingredients) {
        if (missingOnly && ing.itemId && pantryItemIds.has(ing.itemId)) continue;
        if (!ing.itemId) continue; // Cannot add free-text ingredients without an itemId
        const result = await apiRequest({
          method: 'POST',
          path: '/api/shopping',
          body: {
            groupId,
            itemId: ing.itemId,
            itemType: 'global',
            quantity: ing.quantity,
            unit: ing.unit
          }
        });
        added.push(result);
      }

      return { added };
    }
  );
}
