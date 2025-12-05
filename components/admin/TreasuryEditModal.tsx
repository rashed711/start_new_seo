import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { useUI } from '../../contexts/UIContext';
import { useTreasury } from '../../contexts/TreasuryContext';
import type { Treasury } from '../../types';

interface TreasuryEditModalProps {
    treasuryToEdit: Treasury | null;
    onClose: () => void;
}

export const TreasuryEditModal: React.FC<TreasuryEditModalProps> = ({ treasuryToEdit, onClose }) => {
    const { t, isProcessing } = useUI();
    const { addTreasury, updateTreasury } = useTreasury();

    const [name, setName] = useState('');
    const [initialBalance, setInitialBalance] = useState('0');
    
    useEffect(() => {
        if (treasuryToEdit) {
            setName(treasuryToEdit.name);
        } else {
            setName('');
            setInitialBalance('0');
        }
    }, [treasuryToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numericBalance = parseFloat(initialBalance);
        if (name.trim() === '' || (!treasuryToEdit && isNaN(numericBalance))) {
            alert('Please fill all fields correctly.');
            return;
        }

        if (treasuryToEdit) {
            await updateTreasury({ id: treasuryToEdit.id, name: name.trim() });
        } else {
            await addTreasury({ name: name.trim(), initial_balance: numericBalance });
        }
        onClose();
    };

    const formInputClasses = "w-full p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500";
    
    return (
        <Modal title={treasuryToEdit ? t.editTreasury : t.addNewTreasury} onClose={onClose} size="md">
            <form onSubmit={handleSubmit}>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.treasuryName}</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className={formInputClasses} required autoFocus />
                    </div>
                    {!treasuryToEdit && (
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.initialBalance}</label>
                            <input type="number" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} className={formInputClasses} min="0" step="0.01" required />
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold">{t.cancel}</button>
                    <button type="submit" disabled={isProcessing} className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 font-semibold disabled:bg-slate-400">{t.save}</button>
                </div>
            </form>
        </Modal>
    );
};
