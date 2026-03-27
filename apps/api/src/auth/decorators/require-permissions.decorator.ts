import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Usage: @RequirePermissions('release:approve:tenant', 'release:read:tenant')
 * The RBAC guard checks that the session user has ALL listed permissions.
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
