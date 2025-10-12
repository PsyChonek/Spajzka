// Re-export generated API client authentication service and types directly
export { 
  OpenAPI,
  AuthenticationService,
  ApiError
} from '@/api-client'

export type { 
  User,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  UpdateProfileRequest,
  ChangePasswordRequest
} from '@/api-client'
