// Login User
export interface LoginUserInput {
    email: string; // User's email
    password: string; // User's password
  }
  
  export interface LoginUserOutput {
    id: string; // User ID
    jwt: string; // JWT token for authentication
    refreshToken: string; // Refresh token for renewing JWT
  }
  
  // Logout User
  export interface LogoutUserInput {
    token: string; // JWT token to invalidate
  }
  
  export interface LogoutUserOutput {
    message: string; // Success message
  }
  
  // Refresh Token
  export interface RefreshTokenInput {
    refreshToken: string; // Refresh token to validate and renew JWT
  }
  
  export interface RefreshTokenOutput {
    jwt: string; // New JWT token
  }
  
  //#region Helper Interfaces
  
  // JWT Payload
  export interface JWTPayload {
    id: string; // User ID
    iat: number; // Issued at timestamp
    exp: number; // Expiration timestamp
  }
  
  // Refresh Token
  export interface RefreshToken {
    token: string; // Refresh token string
    userId: string; // Associated user ID
    expiresAt: Date; // Expiration date of the refresh token
  }
  
  //#endregion Helper Interfaces
  