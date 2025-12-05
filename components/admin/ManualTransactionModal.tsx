
import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { useUI } from '../../contexts/UIContext';
import { useTreasury } from '../../contexts/TreasuryContext';
import type { Treasury } from '../../types';

interface ManualTransactionModalProps {
    onClose: () => void;
}

export const ManualTransactionModal: React.FC<ManualTransactionModalProps> = ({ onClose }) => {
    const { t, isProcessing } = useUI();
    const { treasuries, addManualTransaction } = useTreasury();

    const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');
    const [amount, setAmount] = useState<string>('');
    const [description, setDescription] = useState('');
    const [treasuryId, setTreasuryId] = useState<number | ''>('');

    useEffect(() => {
        if (treasuries.length > 0) {
            setTreasuryId(treasuries[0].id);
        }
    }, [treasuries]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (!treasuryId || isNaN(numericAmount) || numericAmount <= 0) {
            alert('Please fill all fields correctly.');
            return;
        }

        const success = await addManualTransaction({
            treasury_id: treasuryId,
            transaction_type: type,
            amount: numericAmount,
            description,
        });

        if (success) {
            onClose();
        }
    };
    
    const formInputClasses = "w-full p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500";

    return (
        <Modal title={t.addNewTransaction} onClose={onClose} size="md">
            <form onSubmit={handleSubmit}>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.transactionType}</label>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="tx_type" value="deposit" checked={type==='deposit'} onChange={() => setType('deposit')} /> {t.deposit}</label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="tx_type" value="withdrawal" checked={type==='withdrawal'} onChange={() => setType('withdrawal')} /> {t.withdrawal}</label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.amount}</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className={formInputClasses} min="0.01" step="0.01" required autoFocus />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">{t.treasury}</label>
                        <select value={treasuryId} onChange={e => setTreasuryId(Number(e.target.value))} className={formInputClasses} required>
                            {treasuries.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.transactionDescription} ({t.optional})</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={formInputClasses}></textarea>
                    </div>
                </div>
                 <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold">{t.cancel}</button>
                    <button type="submit" disabled={isProcessing} className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 font-semibold disabled:bg-slate-400">{t.confirm}</button>
                </div>
            </form>
        </Modal>
    );
};
