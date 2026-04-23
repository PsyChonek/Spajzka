import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerDiscoveryTools } from './discovery';
import { registerPantryTools } from './pantry';
import { registerShoppingTools } from './shopping';
import { registerItemsTools } from './items';
import { registerRecipeTools } from './recipes';
import { registerTagTools } from './tags';
import { registerGroupTools } from './groups';
import { registerMealPlanTools } from './mealPlan';

export function registerAllTools(server: McpServer): void {
  registerDiscoveryTools(server);
  registerPantryTools(server);
  registerShoppingTools(server);
  registerItemsTools(server);
  registerRecipeTools(server);
  registerTagTools(server);
  registerGroupTools(server);
  registerMealPlanTools(server);
}
