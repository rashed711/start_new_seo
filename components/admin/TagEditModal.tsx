import React, { useState, useEffect } from 'react';
import type { Tag, Language, LocalizedString } from '../../types';
import { Modal } from '../Modal';
import { useUI } from '../../contexts/UIContext';

interface TagEditModalProps {
    tag: Tag | null;
    onClose: () => void;
    onSave: (tagData: Tag | (Omit<Tag, 'id'> & {id: string})) => void;
}

const emptyTag: Omit<Tag, 'id'> = {
    name: { en: '', ar: '' },
};

export const TagEditModal: React.FC<TagEditModalProps> = ({ tag, onClose, onSave }) => {
    // @FIX: Refactored to get translations `t` directly from the `useUI` hook.
    const { language, t } = useUI();
    const [formData, setFormData] = useState<Omit<Tag, 'id'>>(emptyTag);

    useEffect(() => {
        if (tag) {
            const { id, ...editableData } = tag;
            setFormData(editableData);
        } else {
            setFormData(emptyTag);
        }
    }, [tag]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const [field, lang] = name.split('.');
        setFormData(prev => ({
            ...prev,
            [field]: { ...(prev[field as keyof typeof prev] as LocalizedString), [lang]: value }
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (tag) {
             onSave({ ...tag, ...formData });
        } else {
             const newId = formData.name.en.toLowerCase().replace(/\s+/g, '-');
             onSave({ ...formData, id: newId });
        }
    };

    return (
        <Modal title={tag ? t.editTag : t.addNewTag} onClose={onClose} size="md">
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.tagNameEn}</label>
                    <input type="text" name="name.en" value={formData.name.en} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required />
                    {!tag && <p className="text-xs text-slate-500 mt-1">The ID will be generated from the English name (e.g., "Spicy Food" becomes "spicy-food").</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.tagNameAr}</label>
                    <input type="text" name="name.ar" value={formData.name.ar} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold text-slate-800 dark:text-slate-300">{t.cancel}</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600">{t.save}</button>
                </div>
            </form>
        </Modal>
    );
};