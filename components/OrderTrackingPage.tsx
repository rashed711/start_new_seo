import React, { useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { APP_CONFIG } from '../utils/config';
import { Header } from './Header';
import { Footer } from './Footer';
import { OrderStatusTracker } from './OrderStatusTracker';
import { SearchIcon } from './icons/Icons';

interface OrderStatusResult {
    status: string;
    timestamp: string;
}

export const OrderTrackingPage: React.FC = () => {
    const { t, language, isProcessing, setIsProcessing } = useUI();
    const [orderId, setOrderId] = useState('');
    const [result, setResult] = useState<OrderStatusResult | null>(null);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId.trim()) return;

        setIsProcessing(true);
        setError('');
        setResult(null);

        try {
            const body = new URLSearchParams();
            body.append('id', orderId.trim());

            const response = await fetch(`${APP_CONFIG.API_BASE_URL}get_order_status.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: body,
            });
            
            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.error || t.orderNotFound);
                } catch {
                    throw new Error(t.orderNotFound);
                }
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || t.orderNotFound);
            }
            
            setResult(data.order);

        } catch (err: any) {
            if (err.message.toLowerCase().includes('failed to fetch')) {
                 setError(t.networkRequestFailed);
            } else {
                setError(err.message || t.orderNotFound);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <Header onCartClick={() => window.location.hash = '#/'} />
            <div className="min-h-[70vh] bg-slate-50 dark:bg-slate-900 py-16">
                <main className="container mx-auto max-w-2xl px-4">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{t.trackYourOrder}</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">{t.orderIdPrompt}</p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-8">
                            <div className="relative flex-grow">
                                <input
                                    type="text"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                    placeholder={t.enterOrderId}
                                    className="w-full p-3 ps-10 rounded-lg border-2 border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm sm:text-base dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
                                    required
                                />
                                <div className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400"><SearchIcon className="w-5 h-5" /></div>
                            </div>
                            <button
                                type="submit"
                                disabled={isProcessing}
                                className="bg-primary-600 text-white font-bold py-3 px-3 rounded-lg hover:bg-primary-700 disabled:bg-slate-400 transition-colors whitespace-nowrap text-sm sm:text-base"
                            >
                                {isProcessing ? (language === 'ar' ? '...' : '...') : t.trackOrder}
                            </button>
                        </form>

                        {error && (
                            <div className="text-center p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
                                {error}
                            </div>
                        )}

                        {result && (
                            <div className="animate-fade-in-up">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">{t.status}</h2>
                                <OrderStatusTracker orderStatus={result.status} />
                            </div>
                        )}
                    </div>
                </main>
            </div>
            <Footer />
        </>
    );
};