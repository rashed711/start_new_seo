import React, { useState, useEffect } from 'react';
import type { Role } from '../../types';
import { Modal } from '../Modal';
import { useUI } from '../../contexts/UIContext';
import { useUserManagement } from '../../contexts/UserManagementContext';

interface RoleEditModalProps {
    role: Role | null;
    onClose: () => void;
    onSave: (roleData: Role | Omit<Role, 'isSystem' | 'key'>) => void;
}

const emptyRole: Omit<Role, 'key' | 'isSystem'> = {
    name: { en: '', ar: '' },
};

export const RoleEditModal: React.FC<RoleEditModalProps> = ({ role, onClose, onSave }) => {
    // @FIX: Refactored to get translations `t` directly from the `useUI` hook.
    const { language, t } = useUI();
    const { roles: existingRoles } = useUserManagement();
    const [formData, setFormData] = useState(emptyRole);
    const [error, setError] = useState('');

    useEffect(() => {
        if (role) {
            setFormData({ name: { ...role.name } });
        } else {
            setFormData(emptyRole);
        }
        setError('');
    }, [role]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const [field, lang] = name.split('.');
        setFormData(prev => ({
            ...prev,
            [field]: { ...prev.name, [lang]: value }
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!role) { // Only validate name for new roles to prevent duplicates
            if (existingRoles.some(r => r.name.en.toLowerCase() === formData.name.en.toLowerCase())) {
                setError('A role with this English name already exists.');
                return;
            }
        }

        if (role) {
             onSave({ ...role, ...formData });
        } else {
             onSave(formData);
        }
    };

    return (
        <Modal title={role ? t.editRole : t.addNewRole} onClose={onClose} size="md">
             <form onSubmit={handleSubmit} className="p-5 space-y-4">
                 <div>
                    <label className="block text-sm font-medium mb-1">{t.roleNameEn}</label>
                    <input type="text" name="name.en" value={formData.name.en} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t.roleNameAr}</label>
                    <input type="text" name="name.ar" value={formData.name.ar} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                 {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">{t.cancel}</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600">{t.save}</button>
                </div>
            </form>
        </Modal>
    );
};
