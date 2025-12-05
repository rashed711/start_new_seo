import React, { useState, useEffect } from 'react';
import type { User, Role, UserRole } from '../../../types';
import { useUI } from '../../../contexts/UIContext';
import { useAuth } from '../../../contexts/AuthContext';
import { UsersPage } from './UsersPage';
import { RolesPage } from './RolesPage';

interface StaffAndRolesPageProps {
    // Props for UsersPage
    setEditingUser: (user: User | 'new') => void;
    userSearchTerm: string;
    setUserSearchTerm: (term: string) => void;
    usersToDisplay: User[];
    deleteUser: (userId: number) => void;
    
    // Props for RolesPage
    setEditingRole: (role: Role | 'new') => void;
    setEditingPermissionsForRole: (roleId: UserRole) => void;
    roles: Role[];
    deleteRole: (roleKey: string) => void;
}

export const StaffAndRolesPage: React.FC<StaffAndRolesPageProps> = (props) => {
    const { t } = useUI();
    const { hasPermission } = useAuth();

    const canViewUsers = hasPermission('view_users_page');
    const canViewRoles = hasPermission('view_roles_page');
    
    // Set initial tab based on permissions
    const [activeTab, setActiveTab] = useState<'staff' | 'roles'>(canViewUsers ? 'staff' : 'roles');

    return (
        <div>
            <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-6 rtl:space-x-reverse" aria-label="Tabs">
                    {canViewUsers && (
                         <button
                            onClick={() => setActiveTab('staff')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'staff'
                                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-600'
                            }`}
                        >
                            {t.staff}
                        </button>
                    )}
                   {canViewRoles && (
                        <button
                            onClick={() => setActiveTab('roles')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'roles'
                                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-600'
                            }`}
                        >
                            {t.manageRoles}
                        </button>
                   )}
                </nav>
            </div>

            {activeTab === 'staff' && canViewUsers && (
                <UsersPage
                    pageType="staff"
                    hasPermission={hasPermission}
                    setEditingUser={props.setEditingUser}
                    userSearchTerm={props.userSearchTerm}
                    setUserSearchTerm={props.setUserSearchTerm}
                    usersToDisplay={props.usersToDisplay}
                    roles={props.roles}
                    deleteUser={props.deleteUser}
                />
            )}
            {activeTab === 'roles' && canViewRoles && (
                <RolesPage
                    hasPermission={hasPermission}
                    setEditingRole={props.setEditingRole}
                    setEditingPermissionsForRole={props.setEditingPermissionsForRole}
                    roles={props.roles}
                    deleteRole={props.deleteRole}
                />
            )}
        </div>
    );
};