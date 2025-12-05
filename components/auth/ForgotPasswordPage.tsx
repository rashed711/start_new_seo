import React, { useState } from 'react';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';

export const ForgotPasswordPage: React.FC = () => {
    const { t } = useUI();
    const { sendPasswordResetLink } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        window.location.hash = path;
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const errorMsg = await sendPasswordResetLink(email);
        if (errorMsg) {
            if (errorMsg.includes('auth/user-not-found')) {
                setError(t.emailNotFound);
            } else {
                setError(errorMsg);
            }
        } else {
            setSuccess(t.passwordResetSent);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                <h1 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-400">{t.resetPassword}</h1>
                
                {success ? (
                    <div className="text-center">
                        <p className="text-green-600 dark:text-green-400 mb-4">{success}</p>
                        <a href="#/login" onClick={(e) => handleNav(e, '/login')} className="font-medium text-primary-600 hover:underline dark:text-primary-500">
                            {t.backToLogin}
                        </a>
                    </div>
                ) : (
                    <form className="space-y-6" onSubmit={handleEmailSubmit}>
                        <p className="text-center text-slate-600 dark:text-slate-300">{t.enterEmailPrompt}</p>
                        <div>
                            <label htmlFor="email" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">
                                {t.email}
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
                                required
                                autoFocus
                            />
                        </div>
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <button type="submit" className="w-full px-5 py-3 text-base font-medium text-center text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800 transition shadow-md">
                            {t.resetPassword}
                        </button>
                    </form>
                )}

                {!success && (
                    <div className="text-center border-t border-slate-200 dark:border-slate-700 pt-4">
                        <a href="#/login" onClick={(e) => handleNav(e, '/login')} className="text-sm text-primary-600 hover:underline dark:text-primary-500">
                            {t.backToLogin}
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};