import React, { useEffect, useState } from 'react';
import { useUI } from '../../contexts/UIContext';
import { CheckCircleIcon, CloseIcon } from '../icons/Icons'; 

export const PaymentStatusPage: React.FC = () => {
    const { t, language } = useUI();
    const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        const successParam = params.get('success');
        const orderIdParam = params.get('order'); // Paymob returns its own order ID
        const errorCodeParam = params.get('error_code');

        setIsSuccess(successParam === 'true');
        setOrderId(orderIdParam);
        setErrorCode(errorCodeParam);
    }, []);

    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        window.location.hash = path;
    };

    if (isSuccess === null) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
            <div className="w-full max-w-md p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-center animate-fade-in-up">
                {isSuccess ? (
                    <>
                        <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
                        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">
                            {t.paymentSuccessful}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300">
                            {t.paymentSuccessfulMessage}
                        </p>
                    </>
                ) : (
                    <>
                         <div className="mx-auto w-20 h-20 flex items-center justify-center bg-red-100 dark:bg-red-900/50 rounded-full mb-4">
                            <CloseIcon className="w-12 h-12 text-red-600 dark:text-red-400" strokeWidth={2.5} />
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">
                            {t.paymentFailed}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300">
                            {errorCode === 'finalization_failed'
                                ? t.paymentSuccessOrderFailed
                                : t.paymentFailedMessage
                            }
                        </p>
                    </>
                )}

                 <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a 
                        href="#/"
                        onClick={(e) => handleNav(e, '/')}
                        className="w-full sm:w-auto bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        {t.backToHome}
                    </a>
                     <a 
                        href="#/profile"
                        onClick={(e) => handleNav(e, '/profile')}
                        className="w-full sm:w-auto bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold py-3 px-6 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        {t.myOrders}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default PaymentStatusPage;