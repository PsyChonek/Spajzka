import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiRequest } from '../apiClient';
import { registerTool } from './helpers';

export function registerMealPlanTools(server: McpServer): void {
  registerTool(
    server,
    'list_meal_plan',
    'List scheduled meals in a group for a date range. Call list_groups first to get groupId. Dates must be ISO format (YYYY-MM-DD).',
    {
      groupId: z.string(),
      from: z.string().optional(),
      to: z.string().optional()
    },
    async ({ groupId, from, to }) => {
      return apiRequest({
        method: 'GET',
        path: '/api/meal-plan',
        params: { groupId, from, to }
      });
    }
  );

  registerTool(
    server,
    'add_meal_to_plan',
    "Schedule a recipe on a cookDate. Pass servings to override recipe default (e.g. cook for 2 days of leftovers = servings = 2× recipe.servings). Pass eatDates to mark additional days the meal will be eaten on (leftovers) — the calendar will show the meal on those days but ingredients aggregate only once on cookDate. Call list_recipes first to get recipeId.",
    {
      groupId: z.string(),
      recipeId: z.string(),
      recipeType: z.enum(['global', 'group']),
      cookDate: z.string(),
      servings: z.number().positive().optional(),
      eatDates: z.array(z.string()).optional(),
      mealTypes: z.array(z.string()).optional(),
      notes: z.string().optional()
    },
    async (args) => {
      return apiRequest({
        method: 'POST',
        path: '/api/meal-plan',
        body: args
      });
    }
  );

  registerTool(
    server,
    'update_meal_plan_entry',
    'Reschedule or resize an existing meal entry. Use for moving to another date or adjusting servings.',
    {
      groupId: z.string(),
      mealPlanId: z.string(),
      cookDate: z.string().optional(),
      servings: z.number().positive().optional(),
      eatDates: z.array(z.string()).optional(),
      mealTypes: z.array(z.string()).optional(),
      notes: z.string().optional()
    },
    async ({ mealPlanId, ...body }) => {
      return apiRequest({
        method: 'PATCH',
        path: `/api/meal-plan/${mealPlanId}`,
        body
      });
    }
  );

  registerTool(
    server,
    'remove_meal_plan_entry',
    'Remove a scheduled meal. Set removeShoppingItems=true to also delete shopping-list items generated for this meal.',
    {
      groupId: z.string(),
      mealPlanId: z.string(),
      removeShoppingItems: z.boolean().optional()
    },
    async ({ mealPlanId, groupId, removeShoppingItems }) => {
      await apiRequest({
        method: 'DELETE',
        path: `/api/meal-plan/${mealPlanId}`,
        body: { groupId, removeShoppingItems }
      });
      return { ok: true };
    }
  );

  registerTool(
    server,
    'preview_meal_plan_shopping',
    'Dry-run: aggregate scaled ingredients for meals in a date range. Returns the list that generate_meal_plan_shopping would add without mutating anything. Defaults to missingOnly=true (subtracts pantry stock when units match). Use this before generate_meal_plan_shopping to let the user confirm.',
    {
      groupId: z.string(),
      from: z.string(),
      to: z.string(),
      missingOnly: z.boolean().optional()
    },
    async (args) => {
      return apiRequest({
        method: 'POST',
        path: '/api/meal-plan/shopping-preview',
        body: args
      });
    }
  );

  registerTool(
    server,
    'generate_meal_plan_shopping',
    'Add the aggregated, pantry-subtracted ingredients for planned meals in a date range to the group\'s shopping list. DESTRUCTIVE — mutates shopping. Prefer calling preview_meal_plan_shopping first and confirming with the user.',
    {
      groupId: z.string(),
      from: z.string(),
      to: z.string(),
      missingOnly: z.boolean().optional()
    },
    async (args) => {
      return apiRequest({
        method: 'POST',
        path: '/api/meal-plan/generate-shopping',
        body: args
      });
    }
  );
}
