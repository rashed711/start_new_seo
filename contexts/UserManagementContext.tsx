import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import type { User, Role, Permission } from '../types';
import { APP_CONFIG } from '../utils/config';
import { useUI } from './UIContext';
import { useAuth } from './AuthContext';
import { resolveImageUrl } from '../utils/helpers';

interface UserManagementContextType {
    users: User[];
    isUsersLoading: boolean;
    addUser: (userData: Omit<User, 'id'>) => Promise<void>;
    updateUser: (updatedUser: User) => Promise<void>;
    deleteUser: (userId: number) => Promise<void>;
    resetUserPassword: (user: User, newPassword: string) => Promise<boolean>;
    addRole: (roleData: Omit<Role, 'isSystem' | 'key'>) => Promise<void>;
    updateRole: (roleData: Role) => Promise<void>;
    deleteRole: (roleKey: string) => Promise<void>;
    updateRolePermissions: (roleKey: string, permissions: Permission[]) => Promise<void>;
    // FIX: Add roles to the context type
    roles: Role[];
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined);

export const UserManagementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { setIsProcessing, showToast, t } = useUI();
    const { currentUser, hasPermission, roles: authRoles, setCurrentUser, refetchAuthData } = useAuth();
    
    const [users, setUsers] = useState<User[]>([]);
    const [isUsersLoading, setIsUsersLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        if (!currentUser || !hasPermission('view_users_page')) {
            setUsers([]);
            setIsUsersLoading(false);
            return;
        }
        setIsUsersLoading(true);
        try {
            const res = await fetch(`${APP_CONFIG.API_BASE_URL}get_users.php`);
            if (res.ok) {
                setUsers((await res.json() || []).map((u: any) => ({ 
                    id: Number(u.id), 
                    name: u.name, 
                    mobile: u.mobile, 
                    email: u.email,
                    governorate: u.governorate,
                    address_details: u.address_details,
                    password: '', 
                    role: String(u.role_id), 
                    profilePicture: resolveImageUrl(u.profile_picture) || `https://placehold.co/512x512/60a5fa/white?text=${u.name.charAt(0).toUpperCase()}` 
                })));
            }
        } catch (e) { console.error('Error fetching users:', e); }
        finally { setIsUsersLoading(false); }
    }, [currentUser, hasPermission]);
    
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const addUser = useCallback(async (userData: Omit<User, 'id'>) => {
        if (!hasPermission('add_user')) { showToast(t.permissionDenied); return; }
        const roleName = authRoles.find(r => r.key === userData.role)?.name.en;
        if (!roleName) { showToast("Invalid role selected."); return; }

        setIsProcessing(true);
        try {
            const payload = { name: userData.name, mobile: userData.mobile, password: userData.password, role: roleName };
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_user.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.userAddFailed);
            await fetchUsers();
            showToast(t.userAddedSuccess);
        } catch (error: any) { showToast(error.message || t.userAddFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, t, authRoles, showToast, setIsProcessing, fetchUsers]);

    const updateUser = useCallback(async (updatedUser: User) => {
        if (!hasPermission('edit_user')) { showToast(t.permissionDenied); return; }
        const roleName = authRoles.find(r => r.key === updatedUser.role)?.name.en;
        if (!roleName) { showToast("Invalid role selected."); return; }

        setIsProcessing(true);
        try {
            const payload: any = { id: updatedUser.id, name: updatedUser.name, mobile: updatedUser.mobile, role: roleName };
            if (updatedUser.password) payload.password = updatedUser.password;
            
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_user.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.userUpdateFailed);
            
            await fetchUsers();
            if (currentUser?.id === updatedUser.id) {
                setCurrentUser(prev => prev ? { ...prev, name: updatedUser.name, mobile: updatedUser.mobile, role: updatedUser.role } : null);
            }
            showToast(t.userUpdatedSuccess);
        } catch (error: any) {
            showToast(error.message || t.userUpdateFailed);
            await fetchUsers(); // Re-fetch to revert
        } finally { setIsProcessing(false); }
    }, [hasPermission, t, currentUser, setCurrentUser, authRoles, showToast, setIsProcessing, fetchUsers]);
    
    const deleteUser = useCallback(async (userId: number) => {
        if (currentUser?.id === userId) { showToast(t.deleteUserError); return; }
        if (!hasPermission('delete_user') || !window.confirm(t.confirmDeleteUser)) return;

        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}delete_user.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: userId }) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.userDeleteFailed);
            await fetchUsers();
            showToast(t.userDeletedSuccess);
        } catch(error: any) {
            showToast(error.message || t.userDeleteFailed);
        } finally { setIsProcessing(false); }
    }, [hasPermission, t, currentUser, showToast, setIsProcessing, fetchUsers]);
    
    const resetUserPassword = useCallback(async (user: User, newPassword: string): Promise<boolean> => {
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_user.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: user.id, password: newPassword }) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.passwordResetFailed);
            showToast(t.passwordResetSuccess);
            return true;
        } catch (error: any) {
            showToast(error.message || t.passwordResetFailed);
            return false;
        } finally { setIsProcessing(false); }
    }, [setIsProcessing, showToast, t]);
    
    const addRole = useCallback(async (roleData: Omit<Role, 'isSystem' | 'key'>) => {
        if (!hasPermission('add_role')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_role.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(roleData) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.roleAddFailed);
            showToast(t.roleAddedSuccess);
            await refetchAuthData();
        } catch (error: any) { showToast(error.message || t.roleAddFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, showToast, t, setIsProcessing, refetchAuthData]);

    const updateRole = useCallback(async (roleData: Role) => {
        if (!hasPermission('edit_role')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_role.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(roleData) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.roleUpdateFailed);
            showToast(t.roleUpdatedSuccess);
            await refetchAuthData();
        } catch (error: any) { showToast(error.message || t.roleUpdateFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, showToast, t, setIsProcessing, refetchAuthData]);

    const deleteRole = useCallback(async (roleKey: string) => {
        if (!hasPermission('delete_role')) { showToast(t.permissionDenied); return; }
        const roleToDelete = authRoles.find(r => r.key === roleKey);
        if (!roleToDelete || roleToDelete.isSystem) { showToast("Cannot delete system roles."); return; }
        if (!window.confirm(t.confirmDeleteRole)) return;
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}delete_role.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: roleKey }) });
            const result = await response.json();
            if (!response.ok || !result.success) {
                if (result.errorKey === 'deleteRoleError') throw new Error(t.deleteRoleError);
                throw new Error(result.error || t.roleDeleteFailed);
            }
            showToast(t.roleDeletedSuccess);
            await refetchAuthData();
        } catch (error: any) { showToast(error.message || t.roleDeleteFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, authRoles, refetchAuthData, showToast, t, setIsProcessing]);

    const updateRolePermissions = useCallback(async (roleKey: string, permissions: Permission[]) => {
        if (!hasPermission('manage_permissions')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_permissions.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ roleName: roleKey, permissions }) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.permissionsUpdateFailed);
            await refetchAuthData();
            showToast(t.permissionsUpdatedSuccess);
        } catch(error: any) {
            showToast(error.message || t.permissionsUpdateFailed);
            await refetchAuthData();
        } finally { setIsProcessing(false); }
    }, [hasPermission, t, refetchAuthData, showToast, setIsProcessing]);

    const value: UserManagementContextType = { users, isUsersLoading, addUser, updateUser, deleteUser, resetUserPassword, addRole, updateRole, deleteRole, updateRolePermissions, roles: authRoles };

    return <UserManagementContext.Provider value={value}>{children}</UserManagementContext.Provider>;
};

export const useUserManagement = () => {
    const context = useContext(UserManagementContext);
    if (context === undefined) throw new Error('useUserManagement must be used within a UserManagementProvider');
    return context;
};
