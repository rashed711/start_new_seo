import React, { useState, useEffect, useMemo } from 'react';
import type { Category, Language, LocalizedString } from '../../types';
import { Modal } from '../Modal';
import { useUI } from '../../contexts/UIContext';

interface CategoryEditModalProps {
    category: Category | null;
    categories: Category[]; // Receive the full category tree
    onClose: () => void;
    onSave: (categoryData: Category | Omit<Category, 'id'>) => void;
}

// FIX: Added missing 'display_order' property to satisfy the Omit<Category, 'id'> type.
const emptyCategory: Omit<Category, 'id'> = {
    name: { en: '', ar: '' },
    parent_id: null,
    display_order: 0,
};

// Helper to get all descendant IDs of a category
const getDescendantIds = (categoryId: number, allCategories: Category[]): number[] => {
    const ids: number[] = [];
    const findChildren = (parentId: number) => {
        const children = allCategories.filter(cat => cat.parent_id === parentId);
        children.forEach(child => {
            ids.push(child.id);
            findChildren(child.id);
        });
    };
    findChildren(categoryId);
    return ids;
};


export const CategoryEditModal: React.FC<CategoryEditModalProps> = ({ category, categories, onClose, onSave }) => {
    // @FIX: Refactored to get translations `t` directly from the `useUI` hook.
    const { language, t } = useUI();
    const [formData, setFormData] = useState<Omit<Category, 'id'>>(emptyCategory);

    useEffect(() => {
        if (category) {
            const { id, children, ...editableData } = category;
            // FIX: Spread editableData to include all properties, including 'display_order'.
            setFormData({
                ...editableData,
                parent_id: editableData.parent_id || null
            });
        } else {
            setFormData(emptyCategory);
        }
    }, [category]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'parent_id') {
            setFormData(prev => ({ ...prev, parent_id: value ? parseInt(value, 10) : null }));
        } else {
            const [field, lang] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [field]: { ...(prev[field as keyof typeof prev] as LocalizedString), [lang]: value }
            }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (category) {
             onSave({ ...category, ...formData });
        } else {
             onSave(formData);
        }
    };
    
    const flattenedCategoriesForSelect = useMemo(() => {
        const options: { id: number; name: string; level: number }[] = [];
        const addCategoryToList = (cat: Category, level: number) => {
            options.push({ id: cat.id, name: cat.name[language], level });
            if (cat.children) {
                cat.children.forEach(child => addCategoryToList(child, level + 1));
            }
        };
        categories.forEach(cat => addCategoryToList(cat, 0));
        
        // Exclude current category and its descendants from being a potential parent
        if (category) {
            const flatAll = categories.flatMap(function flatten(c): Category[] { return [c, ...(c.children || []).flatMap(flatten)] });
            const descendantIds = getDescendantIds(category.id, flatAll);
            const excludedIds = [category.id, ...descendantIds];
            return options.filter(opt => !excludedIds.includes(opt.id));
        }

        return options;
    }, [categories, category, language]);


    return (
        <Modal title={category ? t.editCategory : t.addNewCategory} onClose={onClose} size="md">
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.categoryNameEn}</label>
                    <input type="text" name="name.en" value={formData.name.en} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.categoryNameAr}</label>
                    <input type="text" name="name.ar" value={formData.name.ar} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.parentCategory}</label>
                    <select name="parent_id" value={formData.parent_id || ''} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100">
                        <option value="">{t.noParentCategory}</option>
                        {flattenedCategoriesForSelect.map(opt => (
                            <option key={opt.id} value={opt.id}>
                                {'\u00A0\u00A0'.repeat(opt.level * 2)} {opt.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold text-slate-800 dark:text-slate-300">{t.cancel}</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600">{t.save}</button>
                </div>
            </form>
        </Modal>
    );
};
