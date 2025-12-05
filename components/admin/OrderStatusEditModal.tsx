import React, { useState, useEffect } from 'react';
import type { OrderStatusColumn, Language, LocalizedString } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { Modal } from '../Modal';

interface OrderStatusEditModalProps {
    statusColumn: OrderStatusColumn | null;
    onClose: () => void;
    onSave: (data: OrderStatusColumn) => void;
    existingIds: string[];
}

const emptyStatus: Omit<OrderStatusColumn, 'id'> = {
    name: { en: '', ar: '' },
    color: 'slate',
};

const availableColors = ['slate', 'red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'indigo', 'purple', 'pink'];

export const OrderStatusEditModal: React.FC<OrderStatusEditModalProps> = (props) => {
    const { statusColumn, onClose, onSave, existingIds } = props;
    const { t } = useUI();
    
    const [formData, setFormData] = useState<Omit<OrderStatusColumn, 'id'>>(emptyStatus);
    const [id, setId] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (statusColumn) {
            const { id, ...editableData } = statusColumn;
            setFormData(editableData);
            setId(id);
        } else {
            setFormData(emptyStatus);
            setId('');
        }
        setError('');
    }, [statusColumn]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [field, lang] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [field]: { ...(prev[field as keyof typeof prev] as LocalizedString), [lang]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const finalId = statusColumn ? statusColumn.id : id.toLowerCase().replace(/\s+/g, '-');
        if (!finalId) {
            setError('ID is required.');
            return;
        }

        if (!statusColumn && existingIds.includes(finalId)) {
            setError('This ID is already in use.');
            return;
        }

        onSave({ id: finalId, ...formData });
    };

    return (
        <Modal title={statusColumn ? t.editStatus : t.addNewStatus} onClose={onClose} size="md">
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">{t.statusId}</label>
                    <input type="text" name="id" value={id} onChange={(e) => setId(e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 disabled:opacity-50" required disabled={!!statusColumn} />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.statusIdHelper}</p>
                     {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.statusNameEn}</label>
                        <input type="text" name="name.en" value={formData.name.en} onChange={handleTextChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.statusNameAr}</label>
                        <input type="text" name="name.ar" value={formData.name.ar} onChange={handleTextChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t.statusColor}</label>
                    <div className="flex flex-wrap gap-2">
                        {availableColors.map(color => (
                            <label key={color} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="color"
                                    value={color}
                                    checked={formData.color === color}
                                    onChange={handleTextChange}
                                    className="sr-only peer"
                                />
                                <div className={`w-8 h-8 rounded-full bg-${color}-500 peer-checked:ring-2 ring-offset-2 dark:ring-offset-slate-800 ring-primary-500 transition`}></div>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold text-slate-800 dark:text-slate-300">{t.cancel}</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600">{t.save}</button>
                </div>
            </form>
        </Modal>
    );
};