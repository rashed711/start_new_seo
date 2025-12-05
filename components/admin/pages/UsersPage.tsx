import React, { useMemo } from 'react';
import type { User, Role } from '../../../types';
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from '../../icons/Icons';
import { useUI } from '../../../contexts/UIContext';
import { useAuth } from '../../../contexts/AuthContext';

interface UsersPageProps {
    pageType: 'customers' | 'staff';
    hasPermission: (permission: string) => boolean;
    setEditingUser: (user: User | 'new') => void;
    userSearchTerm: string;
    setUserSearchTerm: (term: string) => void;
    usersToDisplay: User[];
    roles: Role[];
    deleteUser: (userId: number) => void;
}

export const UsersPage: React.FC<UsersPageProps> = (props) => {
    const { t, language } = useUI();
    const { currentUser } = useAuth();
    const {
        pageType, hasPermission, setEditingUser,
        userSearchTerm, setUserSearchTerm, usersToDisplay: allUsers, roles, deleteUser
    } = props;

    const pageTitle = pageType === 'customers' ? t.customers : t.staff;

    const usersToDisplay = useMemo(() => {
        if (!currentUser) return [];
        const superAdminRole = roles.find(r => r.name.en.toLowerCase() === 'superadmin');
        const customerRole = roles.find(r => r.name.en.toLowerCase() === 'customer');
        
        const currentUserIsSuperAdmin = currentUser.role === superAdminRole?.key;
        const customerRoleKey = customerRole ? customerRole.key : '___non_existent_key___';

        let baseUsers = currentUserIsSuperAdmin
            ? allUsers
            : allUsers.filter(user => user.role !== superAdminRole?.key);

        if (pageType === 'customers') {
            return baseUsers.filter(user => user.role === customerRoleKey);
        } else { // staff
            return baseUsers.filter(user => user.role !== customerRoleKey);
        }

    }, [allUsers, currentUser, roles, pageType]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{pageTitle}</h2>
                {hasPermission('add_user') && pageType === 'staff' && (
                    <button onClick={() => setEditingUser('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
                        <PlusIcon className="w-5 h-5" />
                        {t.addNewUser}
                    </button>
                )}
            </div>

            <div className="relative my-4">
                <input type="text" placeholder={`${t.name}, ${t.mobileNumber}...`} value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} className="w-full p-2 ps-10 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"/>
                <div className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400"><SearchIcon className="w-5 h-5" /></div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.name}</th>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.mobileNumber}</th>
                            {pageType === 'customers' && <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.email}</th>}
                            {pageType === 'customers' && <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.governorate}</th>}
                            {pageType === 'customers' && <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.addressDetailsLabel}</th>}
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.role}</th>
                            {(hasPermission('edit_user') || hasPermission('delete_user')) && <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.actions}</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {usersToDisplay.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{user.mobile}</td>
                                {pageType === 'customers' && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{user.email || '-'}</td>}
                                {pageType === 'customers' && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{user.governorate || '-'}</td>}
                                {pageType === 'customers' && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300"><p className="max-w-xs truncate" title={user.address_details || ''}>{user.address_details || '-'}</p></td>}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{roles.find(r => r.key === user.role)?.name[language] || user.role}</td>
                                {(hasPermission('edit_user') || hasPermission('delete_user')) && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex items-center gap-4">{hasPermission('edit_user') && <button onClick={() => setEditingUser(user)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1"><PencilIcon className="w-4 h-4" /> {t.edit}</button>}{hasPermission('delete_user') && <button onClick={() => deleteUser(user.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1"><TrashIcon className="w-4 h-4" /> {t.delete}</button>}</div></td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {usersToDisplay.map((user) => (
                    <div key={user.id} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-slate-900 dark:text-slate-100">{user.name}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{user.mobile}</p>
                            </div>
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300">
                                {roles.find(r => r.key === user.role)?.name[language] || user.role}
                            </span>
                        </div>
                        {pageType === 'customers' && (user.email || user.governorate || user.address_details) && (
                             <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-700">
                                {user.email && <p><span className="font-semibold">{t.email}:</span> {user.email}</p>}
                                {user.governorate && <p><span className="font-semibold">{t.governorate}:</span> {user.governorate}</p>}
                                {user.address_details && <p><span className="font-semibold">{t.addressDetailsLabel}:</span> {user.address_details}</p>}
                            </div>
                        )}
                        {(hasPermission('edit_user') || hasPermission('delete_user')) && (
                            <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-end items-center gap-4">
                                {hasPermission('edit_user') && <button onClick={() => setEditingUser(user)} className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 text-sm"><PencilIcon className="w-4 h-4" /> {t.edit}</button>}
                                {hasPermission('delete_user') && <button onClick={() => deleteUser(user.id)} className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1 text-sm"><TrashIcon className="w-4 h-4" /> {t.delete}</button>}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
