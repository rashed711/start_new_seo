import React, { useState } from 'react';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { CheckCircleIcon, UserIcon, CopyIcon, CheckIcon } from '../icons/Icons';
import { CopiedButton } from '../CopiedButton';

interface OrderSuccessScreenProps {
    orderId: string;
}

export const OrderSuccessScreen: React.FC<OrderSuccessScreenProps> = ({ orderId }) => {
    const { t, language } = useUI();
    const { currentUser } = useAuth();
    const { restaurantInfo } = useData();

    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        window.location.hash = path;
    };

    return (
        <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-lg mx-auto animate-fade-in-up">
            <CheckCircleIcon className="w-20 h-20 text-green-500 mb-4" />
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">{t.orderReceived}</h1>
            <p className="text-slate-600 dark:text-slate-300 mb-6">{t.willContactSoon}</p>

            <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl w-full mb-6 text-center border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">{t.yourOrderIdIs}</p>
                <div className="flex items-center justify-center gap-3">
                    <p className="text-lg font-bold font-mono text-primary-600 dark:text-primary-400 tracking-wider">{orderId}</p>
                    <CopiedButton textToCopy={orderId} className="p-2 rounded-lg" />
                </div>
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">{t.useIdToTrack}</p>
            </div>
            
            {restaurantInfo?.whatsappNumber && (
                 <p className="text-sm text-slate-600 dark:text-slate-300 mb-8">
                    {t.forInquiries}
                    <a 
                        href={`https://wa.me/${restaurantInfo.whatsappNumber}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="font-bold text-primary-600 dark:text-primary-400 underline decoration-dotted ltr:ml-1 rtl:mr-1"
                        dir="ltr"
                    >
                        {restaurantInfo.whatsappNumber}
                    </a>
                </p>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                <a 
                    href="#/track"
                    onClick={(e) => handleNav(e, '/track')}
                    className="w-full sm:w-auto bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors shadow-md"
                >
                    {t.trackOrder}
                </a>
                {currentUser ? (
                     <a 
                        href="#/profile"
                        onClick={(e) => handleNav(e, '/profile')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold py-3 px-6 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                       <UserIcon className="w-5 h-5"/> {t.myOrders}
                    </a>
                ) : (
                     <a 
                        href="#/"
                        onClick={(e) => handleNav(e, '/')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold py-3 px-6 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                       {t.backToMenu}
                    </a>
                )}
            </div>
        </div>
    );
};