// Re-export generated API client services and types directly
export { 
  OpenAPI,
  PantryService, 
  ShoppingService,
  ApiError
} from '@/api-client'

export type { 
  PantryItem,
  ShoppingItem,
  CreatePantryItemRequest,
  CreateShoppingItemRequest
} from '@/api-client'

// Utility function
export const isOnline = () => navigator.onLine
