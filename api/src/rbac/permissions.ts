// Permission definitions for the application

export type Permission =
  // Global item permissions
  | 'global_items:create'
  | 'global_items:update'
  | 'global_items:delete'
  // Group management permissions
  | 'group:update'
  | 'group:delete'
  | 'group:manage_members'
  | 'group:manage_roles'
  // Group items permissions
  | 'group_items:create'
  | 'group_items:update'
  | 'group_items:delete'
  // Pantry permissions
  | 'pantry:create'
  | 'pantry:update'
  | 'pantry:delete'
  // Shopping permissions
  | 'shopping:create'
  | 'shopping:update'
  | 'shopping:delete';

export type RoleId = 'system_moderator' | 'admin' | 'moderator' | 'member';

export interface Role {
  _id: RoleId;
  name: string;
  description: string;
  isGlobal: boolean;
  permissions: Permission[];
}

// Permission wildcards for matching
export function matchesPermission(required: Permission, granted: Permission | string): boolean {
  // Exact match
  if (required === granted) {
    return true;
  }

  // Wildcard match (e.g., "group:*" matches "group:update")
  const [grantedResource, grantedAction] = granted.split(':');
  const [requiredResource, requiredAction] = required.split(':');

  if (grantedResource === requiredResource && grantedAction === '*') {
    return true;
  }

  // Full wildcard
  if (granted === '*') {
    return true;
  }

  return false;
}

// Check if a list of permissions includes a required permission
export function hasPermission(
  permissions: (Permission | string)[],
  required: Permission
): boolean {
  return permissions.some(p => matchesPermission(required, p));
}
