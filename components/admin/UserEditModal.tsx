import React, { useState, useEffect, useMemo } from 'react';
import type { User, UserRole, Role } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../Modal';

interface UserEditModalProps {
    user: User | null;
    onClose: () => void;
    onSave: (userData: User | Omit<User, 'id'>) => void;
}

const emptyUser: Omit<User, 'id'> = {
    name: '',
    mobile: '',
    password: '',
    role: 'employee',
};

export const UserEditModal: React.FC<UserEditModalProps> = ({ user, onClose, onSave }) => {
    const { language, t } = useUI();
    const { currentUser, roles } = useAuth();
    
    const [formData, setFormData] = useState<Omit<User, 'id'>>(emptyUser);
    const [error, setError] = useState('');

    const availableRoles = useMemo(() => {
        if (!currentUser) return [];
        const superAdminRole = roles.find(r => r.name.en.toLowerCase() === 'superadmin');
        const currentUserIsSuperAdmin = currentUser.role === superAdminRole?.key;

        if (currentUserIsSuperAdmin) {
            return roles;
        }
        return roles.filter(r => r.name.en.toLowerCase() !== 'superadmin');
    }, [currentUser, roles]);

    useEffect(() => {
        if (user) {
            const { id, ...editableData } = user;
            setFormData({ ...editableData, password: '' }); // Clear password for editing
        } else {
            const employeeRole = availableRoles.find(r => r.name.en.toLowerCase() === 'employee');
            const defaultRoleKey = employeeRole ? employeeRole.key : availableRoles[0]?.key || '';
            setFormData({...emptyUser, role: defaultRoleKey });
        }
        setError('');
    }, [user, availableRoles]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!user && !formData.password) {
            setError(t.passwordRequired);
            return;
        }

        if (user) {
            const dataToSave: User = { ...user, ...formData };
            if (!formData.password) {
                // If password field is empty during edit, keep the old password
                dataToSave.password = user.password;
            }
            onSave(dataToSave);
        } else {
            onSave(formData);
        }
    };

    const isEditingSuperAdmin = useMemo(() => {
        if (!user) return false;
        const roleDetails = roles.find(r => r.key === user.role);
        return roleDetails?.name.en === 'superAdmin';
    }, [user, roles]);

    const isEditingSelfAsAdmin = useMemo(() => {
        if (!user || !currentUser) return false;
        const currentUserRoleDetails = roles.find(r => r.key === currentUser.role);
        return currentUserRoleDetails?.name.en.toLowerCase() === 'admin' && user.id === currentUser.id;
    }, [user, currentUser, roles]);

    const isFormDisabled = isEditingSuperAdmin || isEditingSelfAsAdmin;

    return (
        <Modal title={user ? t.editUser : t.addNewUser} onClose={onClose} size="sm">
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
                {isEditingSelfAsAdmin && (
                    <div className="p-3 text-sm bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-lg">
                        {t.adminCannotEditSelf}
                    </div>
                )}
                <fieldset disabled={isFormDisabled}>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.name}</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 disabled:opacity-50" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.mobileNumber}</label>
                        <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 disabled:opacity-50" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.password}</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 disabled:opacity-50" placeholder={user ? t.passwordOptional : ''} required={!user} />
                        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.role}</label>
                        <select 
                            name="role" 
                            value={formData.role} 
                            onChange={handleChange} 
                            className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 disabled:opacity-50" 
                            required
                            disabled={isFormDisabled || isEditingSuperAdmin} // Redundant but safe
                        >
                            {availableRoles.map(role => (
                                <option key={role.key} value={role.key}>{role.name[language]}</option>
                            ))}
                        </select>
                    </div>
                </fieldset>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold text-slate-800 dark:text-slate-300 transition-colors">{t.cancel}</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:bg-slate-400 disabled:cursor-not-allowed" disabled={isFormDisabled}>{t.save}</button>
                </div>
            </form>
        </Modal>
    );
};
