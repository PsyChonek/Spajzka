// User DTOs
export interface UserDto {
  id: string;
  username: string;
  displayName: string;
  accessCode?: string; // Only included on registration
}

export interface CreateUserDto {
  username: string;
  displayName?: string; // Optional, defaults to username if not provided
}

export interface UpdateUserDto {
  username?: string;
  displayName?: string;
}

export interface LoginDto {
  accessCode: string;
}

export interface TokenResponseDto {
  token: string;
  expiresIn: number;
  user: UserDto;
}

export interface ResetAccessCodeResponseDto {
  accessCode: string;
}

export interface UpgradeGuestDto {
  username: string;
  displayName?: string;
}

// Item DTOs
export interface ItemDto {
  id: string;
  name: string;
  isOnBuylist: boolean;
  amount: number;
  price: number;
  groupId: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateItemDto {
  name: string;
  isOnBuylist?: boolean;
  amount?: number;
  price?: number;
  groupId: string;
  userId: string;
}

export interface UpdateItemDto {
  name?: string;
  isOnBuylist?: boolean;
  amount?: number;
  price?: number;
  groupId?: string;
}

// Group DTOs
export interface GroupDto {
  id: string;
  name: string;
  description?: string;
  userIds: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateGroupDto {
  name: string;
  description?: string;
  userIds?: string[];
}

export interface UpdateGroupDto {
  name?: string;
  description?: string;
}

export interface AddUserToGroupDto {
  userId: string;
}
