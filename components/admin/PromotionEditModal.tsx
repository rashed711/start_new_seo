import React, { useState, useEffect } from 'react';
import type { Promotion, LocalizedString, Product } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { useData } from '../../contexts/DataContext';
import { Modal } from '../Modal';

interface PromotionEditModalProps {
    promotion: Promotion | null;
    onClose: () => void;
    onSave: (promotionData: Promotion | Omit<Promotion, 'id'>) => void;
}

const emptyPromotion: Omit<Promotion, 'id'> = {
    title: { en: '', ar: '' },
    description: { en: '', ar: '' },
    productId: 0,
    discountPercent: 10,
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default to 1 week from now
    isActive: true,
};

export const PromotionEditModal: React.FC<PromotionEditModalProps> = ({ promotion, onClose, onSave }) => {
    // @FIX: Refactored to get translations `t` directly from the `useUI` hook.
    const { language, t } = useUI();
    const { products: allProducts } = useData();
    
    const [formData, setFormData] = useState<Omit<Promotion, 'id'>>(emptyPromotion);
    const [error, setError] = useState('');
    
    useEffect(() => {
        if (promotion) {
            const { id, ...editableData } = promotion;
            setFormData(editableData);
        } else {
            setFormData({...emptyPromotion, productId: allProducts[0]?.id || 0 });
        }
        setError('');
    }, [promotion, allProducts]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setError('');
        
        if (type === 'checkbox') {
             setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
             return;
        }

        if (name.includes('.')) {
            const [field, lang] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [field]: { ...(prev[field as keyof typeof prev] as LocalizedString), [lang]: value }
            }));
        } else if (name === 'productId' || name === 'discountPercent') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else if (name === 'endDate') {
            setFormData(prev => ({ ...prev, [name]: new Date(value).toISOString() }));
        }
        else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (new Date(formData.endDate) < new Date()) {
            setError(t.invalidEndDate);
            return;
        }

        if (promotion) {
             onSave({ ...promotion, ...formData });
        } else {
             onSave(formData);
        }
    };

    const formatDateForInput = (isoDate: string) => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    };

    return (
        <Modal title={promotion ? t.editPromotion : t.addNewPromotion} onClose={onClose} size="lg">
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.promotionTitleEn}</label>
                        <input type="text" name="title.en" value={formData.title.en} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.promotionTitleAr}</label>
                        <input type="text" name="title.ar" value={formData.title.ar} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.descriptionEn}</label>
                        <textarea name="description.en" value={formData.description.en} onChange={handleChange} rows={3} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required></textarea>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.descriptionAr}</label>
                        <textarea name="description.ar" value={formData.description.ar} onChange={handleChange} rows={3} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required></textarea>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.linkedProduct}</label>
                    <select name="productId" value={formData.productId} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required>
                       {allProducts.map(p => <option key={p.id} value={p.id}>{p.name[language]}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.discountPercent}</label>
                        <input type="number" name="discountPercent" value={formData.discountPercent} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required step="1" min="0" max="100" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.endDate}</label>
                         <input type="datetime-local" name="endDate" value={formatDateForInput(formData.endDate)} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:[color-scheme:dark]" required />
                         {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                    </div>
                </div>

                 <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.isActive}</span>
                    </label>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold text-slate-800 dark:text-slate-300">{t.cancel}</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors">{t.save}</button>
                </div>
            </form>
        </Modal>
    );
};