import React, { useState, useMemo } from 'react';
import type { Product, CartItem } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { useData } from '../../contexts/DataContext';
import { useOrders } from '../../contexts/OrderContext';
import { formatNumber, calculateTotal } from '../../utils/helpers';
import { SearchIcon, PlusIcon, MinusIcon, TrashIcon, CheckCircleIcon } from '../icons/Icons';

// Cashier specific item with a unique ID for list management
interface CashierCartItem extends CartItem {
    instanceId: number;
}

export const CashierPage: React.FC = () => {
    const { language, t, isProcessing, setIsProcessing, showToast } = useUI();
    const { products } = useData();
    const { placeOrder } = useOrders();

    const [cart, setCart] = useState<CashierCartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerMobile, setCustomerMobile] = useState('');
    const [orderSuccess, setOrderSuccess] = useState(false);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products.filter(p => p.isVisible);
        const lowercasedTerm = searchTerm.toLowerCase();
        return products.filter(p => 
            p.isVisible && (
                p.name[language].toLowerCase().includes(lowercasedTerm) ||
                p.code.toLowerCase().includes(lowercasedTerm)
            )
        );
    }, [searchTerm, products, language]);

    const total = useMemo(() => calculateTotal(cart), [cart]);

    const addToCart = (product: Product) => {
        if (product.options && product.options.length > 0) {
            // Future: Implement an options modal for cashier
            showToast('Products with options must be added via the main menu for now.');
            return;
        }

        const existingItemIndex = cart.findIndex(item => item.product.id === product.id);
        if (existingItemIndex !== -1) {
            updateQuantity(existingItemIndex, cart[existingItemIndex].quantity + 1);
        } else {
            const newItem: CashierCartItem = {
                instanceId: Date.now(),
                product,
                quantity: 1,
            };
            setCart(prev => [...prev, newItem]);
        }
    };

    const updateQuantity = (index: number, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(index);
            return;
        }
        setCart(prev => prev.map((item, i) => i === index ? { ...item, quantity } : item));
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return;
        setIsProcessing(true);
        try {
            await placeOrder({
                items: cart,
                total: total,
                status: 'completed', // Cashier orders are completed immediately
                orderType: 'Dine-in', // Or determine based on UI
                customer: {
                    name: customerName.trim() || 'Cashier Sale',
                    mobile: customerMobile.trim() || 'N/A'
                },
                paymentMethod: 'cod',
                paymentDetail: 'Cash'
            });
            setOrderSuccess(true);
        } catch (error) {
            showToast('Failed to create order.');
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleNewSale = () => {
        setCart([]);
        setCustomerName('');
        setCustomerMobile('');
        setOrderSuccess(false);
    }
    
    if (orderSuccess) {
        return (
             <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-lg mx-auto animate-fade-in-up mt-10">
                <CheckCircleIcon className="w-20 h-20 text-green-500 mb-4" />
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">Sale Recorded</h1>
                <p className="text-slate-600 dark:text-slate-300 mb-8">The transaction has been successfully recorded.</p>
                <button 
                    onClick={handleNewSale}
                    className="w-full sm:w-auto bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors shadow-md"
                >
                    Start New Sale
                </button>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Left: Product Selection */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 flex flex-col border border-slate-200 dark:border-slate-700">
                <div className="relative mb-4">
                     <input
                        type="text"
                        placeholder={t.searchPlaceholder}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-3 ps-10 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
                    />
                    <div className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400"><SearchIcon className="w-5 h-5" /></div>
                </div>
                <div className="flex-grow overflow-y-auto -mx-2 px-2">
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredProducts.map(p => (
                            <button 
                                key={p.id} 
                                onClick={() => addToCart(p)}
                                className="group bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 text-center hover:bg-primary-50 dark:hover:bg-primary-900/40 border-2 border-transparent hover:border-primary-500 transition-all transform hover:-translate-y-1 flex flex-col items-center"
                            >
                                <img src={p.image} alt={p.name[language]} className="w-24 h-24 rounded-md object-cover mb-2" />
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight flex-grow">{p.name[language]}</p>
                                <p className="text-base font-bold text-primary-600 dark:text-primary-400 mt-1">{p.price.toFixed(2)}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Cart and Checkout */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 flex flex-col border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold mb-4">{t.cart}</h2>
                <div className="flex-grow overflow-y-auto -mx-2 px-2 space-y-3">
                    {cart.length === 0 ? (
                        <p className="text-center text-slate-500 py-10">{t.emptyCart}</p>
                    ) : cart.map((item, index) => (
                        <div key={item.instanceId} className="flex items-center gap-3">
                            <div className="flex-grow">
                                <p className="font-semibold text-sm">{item.product.name[language]}</p>
                                <p className="text-xs text-slate-500">{item.product.price.toFixed(2)} x {item.quantity}</p>
                            </div>
                            <div className="flex items-center">
                                <button onClick={() => updateQuantity(index, item.quantity - 1)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><MinusIcon className="w-4 h-4" /></button>
                                <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                <button onClick={() => updateQuantity(index, item.quantity + 1)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><PlusIcon className="w-4 h-4" /></button>
                            </div>
                            <p className="font-bold w-20 text-end">{(item.product.price * item.quantity).toFixed(2)}</p>
                            <button onClick={() => removeFromCart(index)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
                <div className="border-t pt-4 mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder={t.customerName} className="p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                        <input type="text" value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} placeholder={t.mobileNumber} className="p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                    <div className="flex justify-between items-center font-bold text-2xl">
                        <span>{t.total}:</span>
                        <span>{total.toFixed(2)} {t.currency}</span>
                    </div>
                    <button 
                        onClick={handlePlaceOrder} 
                        disabled={cart.length === 0 || isProcessing}
                        className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:bg-slate-400"
                    >
                        {isProcessing ? '...' : 'Record Sale'}
                    </button>
                </div>
            </div>
        </div>
    );
};