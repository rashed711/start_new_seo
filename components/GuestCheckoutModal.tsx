import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from './Modal';

interface DeliveryDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (details: { mobile: string; address: string }) => void;
}

export const DeliveryDetailsModal: React.FC<DeliveryDetailsModalProps> = ({ isOpen, onClose, onConfirm }) => {
    // @FIX: Refactored to get translations `t` directly from the `useUI` hook.
    const { language, t } = useUI();
    const { currentUser } = useAuth();
    const [mobile, setMobile] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (currentUser) {
                setMobile(currentUser.mobile);
            } else {
                setMobile('');
            }
            setAddress('');
        }
    }, [isOpen, currentUser]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (mobile.trim() && address.trim()) {
            onConfirm({ mobile: mobile.trim(), address: address.trim() });
        }
    }

    const isConfirmDisabled = !mobile.trim() || !address.trim();

    return (
        <Modal title={t.deliveryDetails} onClose={onClose} size="sm">
            <div className="p-5 space-y-4">
                <div>
                    <label htmlFor="delivery-mobile" className="block text-sm font-medium mb-1">{t.mobileNumber}</label>
                    <input
                        id="delivery-mobile"
                        type="tel"
                        placeholder={t.mobileNumber}
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="w-full p-3 text-base border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-slate-200 dark:disabled:bg-slate-700"
                        disabled={!!currentUser}
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="delivery-address" className="block text-sm font-medium mb-1">{t.address}</label>
                    <textarea
                        id="delivery-address"
                        placeholder={t.enterAddressPrompt}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={3}
                        className="w-full p-3 text-base border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        required
                    />
                </div>
                <button
                    onClick={handleConfirm}
                    disabled={isConfirmDisabled}
                    className="w-full mt-4 bg-green-500 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    {t.confirmOrder}
                </button>
            </div>
        </Modal>
    );
};