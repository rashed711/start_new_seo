import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Placeholder, we'll parse hash manually
import { auth } from '../../firebase';
import { applyActionCode } from 'firebase/auth';
import { useUI } from '../../contexts/UIContext';
import { CheckCircleIcon, CloseIcon } from '../icons/Icons'; // Assuming CloseIcon exists

export const ActionHandlerPage: React.FC = () => {
    const { t, language } = useUI();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const handleAction = async () => {
            const params = new URLSearchParams(window.location.hash.split('?')[1]);
            const mode = params.get('mode');
            const actionCode = params.get('oobCode');

            if (!actionCode || !mode) {
                setStatus('error');
                setErrorMessage('Invalid action link.');
                return;
            }

            try {
                switch (mode) {
                    case 'verifyEmail':
                        await applyActionCode(auth, actionCode);
                        setStatus('success');
                        break;
                    // You can add other modes like 'resetPassword' here in the future
                    default:
                        throw new Error('Unsupported action mode.');
                }
            } catch (error: any) {
                setStatus('error');
                setErrorMessage(error.message || 'An unknown error occurred.');
                console.error("Firebase action error:", error);
            }
        };

        handleAction();
    }, []);

    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        window.location.hash = path;
    };

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return <p>{language === 'ar' ? 'جار التحقق...' : 'Verifying...'}</p>;
            case 'success':
                return (
                    <div className="text-center">
                        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                            {language === 'ar' ? 'تم التحقق من بريدك الإلكتروني بنجاح!' : 'Your email has been verified!'}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300">
                            {language === 'ar' ? 'يمكنك الآن تسجيل الدخول باستخدام حسابك الجديد.' : 'You can now sign in with your new account.'}
                        </p>
                        <a 
                            href="#/login" 
                            onClick={(e) => handleNav(e, '/login')}
                            className="mt-6 inline-block bg-primary-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            {t.login}
                        </a>
                    </div>
                );
            case 'error':
                return (
                     <div className="text-center">
                        <div className="mx-auto w-16 h-16 flex items-center justify-center bg-red-100 dark:bg-red-900/50 rounded-full mb-4">
                            <CloseIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                            {language === 'ar' ? 'حدث خطأ' : 'An Error Occurred'}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300">
                            {language === 'ar' ? 'لا يمكن إكمال هذا الإجراء. قد يكون الرابط غير صالح أو منتهي الصلاحية.' : 'This action could not be completed. The link may be invalid or expired.'}
                        </p>
                         <a 
                            href="#/login" 
                            onClick={(e) => handleNav(e, '/login')}
                            className="mt-6 inline-block bg-primary-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            {t.backToLogin}
                        </a>
                    </div>
                );
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
            <div className="w-full max-w-md p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                {renderContent()}
            </div>
        </div>
    );
};
