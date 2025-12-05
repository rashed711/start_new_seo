import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { Permission, Language, UserRole, RestaurantInfo, Role } from '../../types';
import { CloseIcon, ClipboardListIcon } from '../icons/Icons';
import { PERMISSION_GROUPS, PermissionGroup } from '../../data/permissions';
import { useUI } from '../../contexts/UIContext';
import { useUserManagement } from '../../contexts/UserManagementContext';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../i18n/translations';

interface PermissionCardProps {
    group: PermissionGroup;
    selectedPermissions: Permission[];
    handleCheckboxChange: (permissionId: Permission, isChecked: boolean) => void;
    handleGroupToggle: (groupPermissions: { id: string }[], isChecked: boolean) => void;
    isDisabled: boolean;
    t: typeof translations['en'];
}

const PermissionCard: React.FC<PermissionCardProps> = ({ group, selectedPermissions, handleCheckboxChange, handleGroupToggle, isDisabled, t }) => {
    const allGroupPermissions = group.permissions.map(p => p.id);
    const isAllSelected = allGroupPermissions.every(p => selectedPermissions.includes(p));
    const GroupIcon = group.icon;
    const groupName = t[group.nameKey];

    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
                        checked={isAllSelected}
                        onChange={(e) => handleGroupToggle(group.permissions, e.target.checked)}
                        disabled={isDisabled}
                    />
                    <GroupIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <span className="font-bold text-slate-700 dark:text-slate-200">{groupName}</span>
                </label>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                {group.permissions.map((permission) => (
                    <label key={permission.id} className={`flex items-center gap-3 p-2 rounded-md transition-colors ${isDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>
                        <input
                            type="checkbox"
                            className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={e => handleCheckboxChange(permission.id, e.target.checked)}
                            disabled={isDisabled}
                        />
                        <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{t[permission.nameKey]}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}


interface PermissionsEditModalProps {
  roleId: UserRole;
  onClose: () => void;
  onSave: (roleId: UserRole, permissions: Permission[]) => void;
}

export const PermissionsEditModal: React.FC<PermissionsEditModalProps> = ({ roleId, onClose, onSave }) => {
  const { language, t } = useUI();
  const { restaurantInfo } = useData();
  const { roles } = useAuth(); // AuthContext holds the roles list
  const { currentUser, rolePermissions, hasPermission } = useAuth();
  const currentPermissions = rolePermissions[roleId] || [];

  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(currentPermissions);
  
  const portalRoot = document.getElementById('portal-root');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (!portalRoot || !restaurantInfo) return null;

  const role = useMemo(() => roles.find(r => r.key === roleId), [roles, roleId]);
  
  const userRoleDetails = useMemo(() => {
    if (!currentUser) return null;
    return roles.find(r => r.key === currentUser.role);
  }, [currentUser, roles]);

  const isCurrentUserSuperAdmin = useMemo(() => {
    return userRoleDetails?.name.en.toLowerCase() === 'superadmin';
  }, [userRoleDetails]);
  
  const availablePermissionGroups = useMemo(() => {
      if (isCurrentUserSuperAdmin) {
          // Super admin sees all possible permissions defined in the system.
          return Object.values(PERMISSION_GROUPS);
      }
      
      // Other users only see the permissions they are granted.
      return Object.values(PERMISSION_GROUPS).map(group => {
          // Filter each group's permissions based on what the current user has.
          const availablePermissions = group.permissions.filter(permission => 
              hasPermission(permission.id)
          );
          
          // Return the group but with the filtered permissions list.
          return { ...group, permissions: availablePermissions };
      }).filter(group => group.permissions.length > 0); // Hide groups that become empty after filtering.

  }, [isCurrentUserSuperAdmin, hasPermission]);

  const handleCheckboxChange = (permissionId: Permission, isChecked: boolean) => {
    if (isChecked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(p => p !== permissionId));
    }
  };
  
  const handleGroupToggle = (groupPermissions: { id: string }[], isChecked: boolean) => {
      const groupPermissionIds = groupPermissions.map(p => p.id);
      if (isChecked) {
          setSelectedPermissions(prev => [...new Set([...prev, ...groupPermissionIds])]);
      } else {
          setSelectedPermissions(prev => prev.filter(p => !groupPermissionIds.includes(p)));
      }
  }

  const handleSave = () => {
    onSave(roleId, selectedPermissions);
    onClose();
  };

  const isSuperAdminRole = role?.name.en.toLowerCase() === 'superadmin';

  const isEditingOwnRoleAsAdmin = useMemo(() => {
    if (!currentUser || !role) return false;
    const currentUserRoleDetails = roles.find(r => r.key === currentUser.role);
    return currentUserRoleDetails?.name.en.toLowerCase() === 'admin' && role.key === currentUser.role;
  }, [currentUser, role, roles]);

  const isDisabled = isSuperAdminRole || isEditingOwnRoleAsAdmin;

  if (!role) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in-up" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.editPermissions}: <span className="text-primary-600">{role.name[language]}</span></h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            <CloseIcon className="w-6 h-6"/>
          </button>
        </div>
        <div className="p-5 space-y-6 overflow-y-auto">
          {isSuperAdminRole && (
            <div className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg text-sm">
              Super Admin permissions cannot be changed.
            </div>
          )}
          {isEditingOwnRoleAsAdmin && (
            <div className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg text-sm">
                {t.adminCannotEditOwnPermissions}
            </div>
          )}
          
          <div className="space-y-6">
             {availablePermissionGroups.map((group, index) => (
                <PermissionCard 
                  key={index} 
                  group={group}
                  selectedPermissions={selectedPermissions}
                  handleCheckboxChange={handleCheckboxChange}
                  handleGroupToggle={handleGroupToggle}
                  isDisabled={isDisabled}
                  t={t}
                />
             ))}
          </div>

        </div>
        <div className="p-4 flex justify-end gap-4 border-t border-slate-200 dark:border-slate-700 shrink-0 mt-auto bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold text-slate-800 dark:text-slate-300 transition-colors">{t.cancel}</button>
          <button
            onClick={handleSave}
            disabled={isDisabled}
            className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>,
    portalRoot
  );
};