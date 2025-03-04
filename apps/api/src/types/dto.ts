export interface UserDto {
    id: string;
    email: string;
    displayName: string;
  }
  
  export interface CreateUserDto {
    email: string;
    password: string;
    displayName: string;
  }
  
  export interface LoginDto {
    email: string;
    password: string;
  }
  
  export interface TokenResponseDto {
    token: string;
    expiresIn: number;
  }
  
  // Add more DTOs for your other resources
  