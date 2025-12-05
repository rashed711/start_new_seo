import React, { useState, useEffect } from 'react';
import type { Supplier } from '../../types';
import { Modal } from '../Modal';
import { useUI } from '../../contexts/UIContext';
import { useInventory } from '../../contexts/InventoryContext';

interface SupplierEditModalProps {
    supplier: Supplier | null;
    onClose: () => void;
}

const emptySupplier: Omit<Supplier, 'id'> = {
    name: '',
    contact_person: '',
    mobile: '',
    email: '',
    address: '',
};

export const SupplierEditModal: React.FC<SupplierEditModalProps> = ({ supplier, onClose }) => {
    const { t } = useUI();
    const { addSupplier, updateSupplier } = useInventory();
    const [formData, setFormData] = useState(emptySupplier);

    useEffect(() => {
        if (supplier) {
            const { id, ...editableData } = supplier;
            setFormData({
                name: editableData.name || '',
                contact_person: editableData.contact_person || '',
                mobile: editableData.mobile || '',
                email: editableData.email || '',
                address: editableData.address || '',
            });
        } else {
            setFormData(emptySupplier);
        }
    }, [supplier]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (supplier) {
            updateSupplier({ ...supplier, ...formData });
        } else {
            addSupplier(formData);
        }
        onClose();
    };
    
    const formInputClasses = "w-full p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500";

    return (
        <Modal title={supplier ? t.editSupplier : t.addNewSupplier} onClose={onClose} size="lg">
            <form onSubmit={handleSubmit} className="p-5 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.supplierName}</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className={formInputClasses} required autoFocus />
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-base font-semibold text-slate-600 dark:text-slate-300 mb-2">{t.supplierContactInfo}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.contactPerson}</label>
                            <input type="text" name="contact_person" value={formData.contact_person} onChange={handleChange} className={formInputClasses} />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.mobileNumber}</label>
                            <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} className={formInputClasses} />
                        </div>
                    </div>
                     <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.email}</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className={formInputClasses} />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                     <h3 className="text-base font-semibold text-slate-600 dark:text-slate-300 mb-2">{t.supplierAddressInfo}</h3>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.address}</label>
                        <textarea name="address" value={formData.address} onChange={handleChange} rows={3} className={formInputClasses}></textarea>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold text-slate-800 dark:text-slate-300 transition-colors">{t.cancel}</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 font-semibold transition-colors">{t.save}</button>
                </div>
            </form>
        </Modal>
    );
};
