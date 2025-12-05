import { useCallback, useMemo } from 'react';
import type { User, Permission, UserRole, Role } from '../types';

export const usePermissions = (
  currentUser: User | null,
  rolePermissions: Record<UserRole, Permission[]>,
  roles: Role[]
) => {
  const userRoleDetails = useMemo(() => {
    if (!currentUser) return null;
    return roles.find(r => r.key === currentUser.role);
  }, [currentUser, roles]);

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!currentUser || !userRoleDetails) return false;
      
      // Super admin always has all permissions, checked by name for stability
      if (userRoleDetails.name.en.toLowerCase() === 'superadmin') {
        return true;
      }
      
      // Permissions are keyed by the role ID, which is in currentUser.role
      const userPermissions = rolePermissions[currentUser.role];
      return userPermissions?.includes(permission) ?? false;
    },
    [currentUser, rolePermissions, userRoleDetails]
  );

  return { hasPermission };
};
