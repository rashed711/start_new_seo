import React from 'react';
import type { Role, UserRole } from '../../../types';
import { PlusIcon, PencilIcon, TrashIcon, ShieldCheckIcon } from '../../icons/Icons';
import { useUI } from '../../../contexts/UIContext';

interface RolesPageProps {
    hasPermission: (permission: string) => boolean;
    setEditingRole: (role: Role | 'new') => void;
    setEditingPermissionsForRole: (roleId: UserRole) => void;
    roles: Role[];
    deleteRole: (roleKey: string) => void;
}

export const RolesPage: React.FC<RolesPageProps> = (props) => {
    const { t, language } = useUI();
    const { hasPermission, setEditingRole, setEditingPermissionsForRole, roles, deleteRole } = props;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.manageRoles}</h2>
                {hasPermission('add_role') && <button onClick={() => setEditingRole('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"><PlusIcon className="w-5 h-5" />{t.addNewRole}</button>}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.role}</th>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {roles.map(role => (
                            <tr key={role.key} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{role.name[language]}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-4">
                                        {hasPermission('manage_permissions') && <button onClick={() => setEditingPermissionsForRole(role.key)} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 flex items-center gap-1"><ShieldCheckIcon className="w-4 h-4" /> {t.editPermissions}</button>}
                                        {hasPermission('edit_role') && !role.isSystem && <button onClick={() => setEditingRole(role)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1"><PencilIcon className="w-4 h-4" /> {t.edit}</button>}
                                        {hasPermission('delete_role') && !role.isSystem && <button onClick={() => deleteRole(role.key)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1"><TrashIcon className="w-4 h-4" /> {t.delete}</button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};