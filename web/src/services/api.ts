// Re-export generated API client services and types directly
export {
  OpenAPI,
  PantryService,
  ShoppingService,
  ItemsService,
  ApiError
} from '@/api-client'

export type {
  PantryItem,
  ShoppingItem,
  Item,
  CreatePantryItemRequest,
  CreateShoppingItemRequest,
  CreateItemRequest
} from '@/api-client'

// Utility function
export const isOnline = () => navigator.onLine
