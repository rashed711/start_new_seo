
import React, { useMemo } from 'react';
import type { CartItem, Language, OrderType, RestaurantInfo } from '../types';
import { PlusIcon, MinusIcon, CloseIcon, TrashIcon } from './icons/Icons';
import { calculateTotal, formatNumber, calculateItemUnitPrice, calculateItemTotal, calculateOriginalItemUnitPrice, calculateOriginalItemTotal, calculateTotalSavings } from '../utils/helpers';
import { useCart } from '../contexts/CartContext';
import { useUI } from '../contexts/UIContext';
import { useData } from '../contexts/DataContext';

interface CartContentsProps {
  isSidebar?: boolean;
  onClose?: () => void;
}

export const CartContents: React.FC<CartContentsProps> = ({
  isSidebar = false,
  onClose,
}) => {
  const { cartItems, updateCartQuantity, clearCart } = useCart();
  const { language, t } = useUI();
  const { restaurantInfo } = useData();

  const subtotal = useMemo(() => calculateTotal(cartItems), [cartItems]);
  const totalSavings = useMemo(() => calculateTotalSavings(cartItems), [cartItems]);
  const originalSubtotal = useMemo(() => subtotal + totalSavings, [subtotal, totalSavings]);


  const handleCheckout = () => {
      if (onClose) onClose();
      window.location.hash = `#/checkout`;
  }

  const getItemVariantId = (item: CartItem) => {
      return item.product.id + JSON.stringify(item.options || {});
  }
  
  const isPlaceOrderDisabled = cartItems.length === 0;

  if (!restaurantInfo) return null;

  return (
    <>
      <div className="relative flex justify-between items-center p-4 pt-5 sm:pt-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full sm:hidden" aria-hidden="true"></div>
        <h2 id="cart-heading" className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.cart}</h2>
        {isSidebar && onClose && (
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={t.close}>
              <CloseIcon className="w-6 h-6"/>
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="flex-grow flex items-center justify-center p-4 text-center">
          <div>
            <p className="text-slate-500 dark:text-slate-400">{t.emptyCart}</p>
            <a href="#menu" onClick={onClose} className="mt-2 text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              {language === 'ar' ? 'ابدأ التسوق' : 'Start Shopping'}
            </a>
          </div>
        </div>
      ) : (
        <div className="overflow-y-auto p-4 space-y-3 flex-grow">
          {cartItems.map(item => {
            const finalTotal = calculateItemTotal(item);
            const originalTotal = calculateOriginalItemTotal(item);

            return (
              <div key={getItemVariantId(item)} className="flex items-start gap-3 p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                  <img src={item.product.image} alt={item.product.name[language]} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                  <div className="flex-grow">
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.product.name[language]}</p>
                      {item.options && Object.keys(item.options).length > 0 && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {Object.entries(item.options).map(([optionKey, valueKey]) => {
                                  const option = item.product.options?.find(o => o.name.en === optionKey);
                                  const value = option?.values.find(v => v.name.en === valueKey);
                                  if (option && value) {
                                      const priceModifierText = value.priceModifier > 0
                                          ? ` (+${value.priceModifier.toFixed(2)})`
                                          : '';
                                      return <div key={optionKey}>+ {value.name[language]}{priceModifierText}</div>;
                                  }
                                  return null;
                              })}
                          </div>
                      )}
                      {item.quantity > 1 && !item.appliedDiscountPercent && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            @ {calculateItemUnitPrice(item).toFixed(2)} {t.currency}
                        </p>
                      )}
                      {item.quantity > 1 && item.appliedDiscountPercent && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            @ {calculateItemUnitPrice(item).toFixed(2)} <span className="line-through">{calculateOriginalItemUnitPrice(item).toFixed(2)}</span>
                        </p>
                      )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="flex items-center gap-2">
                          <button
                              onClick={() => updateCartQuantity(item.product.id, item.options, item.quantity - 1)}
                              className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
                              aria-label="Decrease quantity"
                          >
                              {item.quantity === 1 ? <TrashIcon className="w-4 h-4 text-red-500" /> : <MinusIcon className="w-4 h-4 text-slate-700 dark:text-slate-300" />}
                          </button>
                          <span className="font-bold w-6 text-center text-slate-800 dark:text-slate-200">{formatNumber(item.quantity)}</span>
                          <button
                              onClick={() => updateCartQuantity(item.product.id, item.options, item.quantity + 1)}
                              className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
                              aria-label="Increase quantity"
                          >
                              <PlusIcon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                          </button>
                      </div>
                      {item.appliedDiscountPercent ? (
                          <div className="text-right mt-1">
                              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                  {finalTotal.toFixed(2)} {t.currency}
                              </p>
                              <p className="font-normal text-xs text-slate-500 dark:text-slate-400 line-through">
                                  {originalTotal.toFixed(2)} {t.currency}
                              </p>
                          </div>
                      ) : (
                          <p className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-1">
                              {finalTotal.toFixed(2)} {t.currency}
                          </p>
                      )}
                  </div>
              </div>
            )})}
        </div>
      )}

      {cartItems.length > 0 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0 bg-slate-50 dark:bg-slate-900/50">
          {totalSavings > 0 && (
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>{t.subtotal}</span>
                  <span className="font-medium">{originalSubtotal.toFixed(2)} {t.currency}</span>
              </div>
          )}
          {totalSavings > 0 && (
              <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                  <span>{t.discount}</span>
                  <span className="font-medium">-{totalSavings.toFixed(2)} {t.currency}</span>
              </div>
          )}
          <div className={`flex justify-between font-bold ${totalSavings > 0 ? 'text-lg pt-2 border-t border-slate-200 dark:border-slate-700' : 'text-lg'} text-slate-800 dark:text-slate-100`}>
              <span>{t.total}</span>
              <span>{subtotal.toFixed(2)} {t.currency}</span>
          </div>
          
          {/* Updated Buttons Layout */}
          <div className="flex items-stretch gap-3 pt-3">
            <button 
                onClick={clearCart} 
                className="flex items-center justify-center p-3 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors border border-red-200 dark:border-red-800/50"
                aria-label="Clear Cart"
                title="Clear Cart"
            >
                <TrashIcon className="w-6 h-6" />
            </button>
            <button 
                onClick={handleCheckout} 
                disabled={isPlaceOrderDisabled} 
                className="flex-1 bg-green-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-green-600 transition-all flex justify-center items-center shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
            >
                {t.checkout}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
