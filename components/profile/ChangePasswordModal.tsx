import React, { useState } from 'react';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../Modal';

interface ChangePasswordModalProps {
    onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
    // @FIX: Refactored to get translations `t` directly from the `useUI` hook.
    const { language, isProcessing, t } = useUI();
    const { changeCurrentUserPassword } = useAuth();
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) {
            setError(t.passwordsDoNotMatch);
            return;
        }
        if (newPassword.length < 6) {
             setError('Password must be at least 6 characters long.');
             return;
        }

        const errorMsg = await changeCurrentUserPassword(currentPassword, newPassword);
        if (errorMsg) {
            setError(errorMsg);
        } else {
            onClose();
        }
    };

    return (
        <Modal title={t.changePassword} onClose={onClose} size="sm">
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-800 dark:text-slate-300">{t.currentPassword}</label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                        required
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1 text-slate-800 dark:text-slate-300">{t.newPassword}</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                        required
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1 text-slate-800 dark:text-slate-300">{t.confirmNewPassword}</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                        required
                    />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold text-slate-800 dark:text-slate-300">{t.cancel}</button>
                    <button type="submit" disabled={isProcessing} className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:bg-slate-400">
                        {isProcessing ? 'Saving...' : t.save}
                    </button>
                </div>
            </form>
        </Modal>
    );
};