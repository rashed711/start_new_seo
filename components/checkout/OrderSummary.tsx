
import React, { useState } from 'react';
import { calculateTotal, calculateItemTotal, calculateOriginalItemTotal, calculateTotalSavings } from '../../utils/helpers';
import { ChevronRightIcon } from '../icons/Icons';
import { useUI } from '../../contexts/UIContext';
import { useCart } from '../../contexts/CartContext';

export const OrderSummary: React.FC = () => {
    const { language, t } = useUI();
    const { cartItems } = useCart();
    const [isExpanded, setIsExpanded] = useState(false);
    
    const subtotal = calculateTotal(cartItems);
    const totalSavings = calculateTotalSavings(cartItems);
    const originalSubtotal = subtotal + totalSavings;


    const summaryContent = (
        <div className="space-y-4">
            {cartItems.map((item, index) => {
                const finalTotal = calculateItemTotal(item);
                const originalTotal = calculateOriginalItemTotal(item);
                return (
                    <div key={index} className="flex items-start gap-4">
                        <div className="relative">
                            <img src={item.product.image} alt={item.product.name[language]} className="w-16 h-16 rounded-lg object-cover" />
                            <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                                {item.quantity}
                            </span>
                        </div>
                        <div className="flex-grow">
                            <p className="font-semibold text-sm leading-tight text-slate-800 dark:text-slate-100">{item.product.name[language]}</p>
                        </div>
                         {item.appliedDiscountPercent ? (
                            <div className="text-right">
                                <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">{finalTotal.toFixed(2)} {t.currency}</p>
                                <p className="text-xs text-slate-500 line-through">{originalTotal.toFixed(2)} {t.currency}</p>
                            </div>
                        ) : (
                            <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">{finalTotal.toFixed(2)} {t.currency}</p>
                        )}
                    </div>
                )
            })}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {totalSavings > 0 && (
                    <div className="flex justify-between">
                        <span>{t.subtotal}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-100">{originalSubtotal.toFixed(2)} {t.currency}</span>
                    </div>
                )}
                {totalSavings > 0 && (
                    <div className="flex justify-between text-red-600 dark:text-red-400">
                        <span>{t.discount}</span>
                        <span className="font-medium">-{totalSavings.toFixed(2)} {t.currency}</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span>{t.shipping}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                        {language === 'ar' ? 'تطبق الرسوم' : 'Fees apply'}
                    </span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2 flex justify-between font-bold text-lg text-slate-800 dark:text-slate-100">
                    <span>{t.total}</span>
                    <span>{subtotal.toFixed(2)} {t.currency}</span>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="lg:hidden bg-slate-100 dark:bg-slate-800 rounded-xl border dark:border-slate-700 overflow-hidden">
                <button onClick={() => setIsExpanded(!isExpanded)} className="w-full p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t.yourOrder}</h2>
                        <span className="text-sm text-slate-500 dark:text-slate-400">{cartItems.length} {t.items}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-slate-800 dark:text-slate-100">{subtotal.toFixed(2)} {t.currency}</span>
                        <ChevronRightIcon className={`w-6 h-6 text-slate-600 dark:text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : (language === 'ar' ? '-rotate-180' : 'rotate-0')}`} />
                    </div>
                </button>
                <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-screen' : 'max-h-0'}`}>
                    <div className="p-4 border-t dark:border-slate-700">{summaryContent}</div>
                </div>
            </div>

            <div className="hidden lg:block sticky top-28">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border dark:border-slate-700">
                    <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{t.yourOrder}</h2>
                    {summaryContent}
                </div>
            </div>
        </>
    );
};
