import type { UserRole } from '@/lib/types';

// Central role helpers. Pure (no 'server-only'), so they're safe to import from
// client components, API routes, and the edge middleware alike.
//
// The privilege model: `superadmin` is a strict superset of `admin`. Everywhere
// the app grants a capability to an admin, a superadmin must get it too — so
// gate admin-level access through `isAdminRole`, never a bare `role === 'admin'`.
// The handful of *master* controls that only a superadmin may perform (creating
// accounts, changing roles, deleting users, granting listing quota) are gated
// with `isSuperAdmin`.

/** Roles that may enter the Admin Portal and use admin-level APIs. */
export const ADMIN_ROLES: readonly UserRole[] = ['admin', 'superadmin'];

/** True for any role with admin-level access (admin OR superadmin). */
export function isAdminRole(role?: string | null): boolean {
  return role === 'admin' || role === 'superadmin';
}

/** True only for the top-level superadmin role (the master portal controller). */
export function isSuperAdmin(role?: string | null): boolean {
  return role === 'superadmin';
}
