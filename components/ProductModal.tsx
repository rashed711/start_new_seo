
import React, { useState, useEffect, useMemo } from 'react';
import type { Product, Promotion } from '../types';
import { StarIcon, PlusIcon } from './icons/Icons';
import { formatNumber, getActivePromotionForProduct } from '../utils/helpers';
import { Modal } from './Modal';
import { useUI } from '../contexts/UIContext';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  addToCart: (product: Product, quantity: number, options?: { [key: string]: string }) => void;
  promotions: Promotion[];
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  addToCart,
  promotions
}) => {
  const { t, language } = useUI();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    const defaultOptions: { [key: string]: string } = {};
    product.options?.forEach(option => {
      if (option.values.length > 0) {
        defaultOptions[option.name.en] = option.values[0].name.en;
      }
    });
    setSelectedOptions(defaultOptions);
    setQuantity(1);
    setIsImageLoaded(false); // Reset on product change
  }, [product]);

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedOptions);
    onClose();
  };

  const handleOptionChange = (optionKey: string, valueKey: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionKey]: valueKey }));
  };
  
  const promotion = getActivePromotionForProduct(product.id, promotions);

    const originalUnitPrice = useMemo(() => {
        let price = product.price;
        product.options?.forEach(option => {
            const selectedValueKey = selectedOptions[option.name.en];
            const selectedValue = option.values.find(v => v.name.en === selectedValueKey);
            if (selectedValue) {
                price += selectedValue.priceModifier;
            }
        });
        return price;
    }, [product, selectedOptions]);

    const discountedUnitPrice = useMemo(() => {
        if (!promotion) return originalUnitPrice;
        return originalUnitPrice * (1 - promotion.discountPercent / 100);
    }, [originalUnitPrice, promotion]);

    const finalTotalPrice = discountedUnitPrice * quantity;
    const originalTotalPrice = originalUnitPrice * quantity;

  return (
    <Modal title={product.name[language]} onClose={onClose} size="3xl">
      <div className="overflow-y-auto p-4 sm:p-5 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
          <div className="md:col-span-2 flex items-start justify-center">
            <div className="relative w-full">
              {!isImageLoaded && (
                <div className="aspect-[4/3] w-full rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
              )}
              <img 
                src={product.image} 
                alt={product.name[language]} 
                className={`w-full h-auto max-h-[75vh] rounded-xl object-cover shadow-lg transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{ display: isImageLoaded ? 'block' : 'none' }}
                onLoad={() => setIsImageLoaded(true)}
              />
            </div>
          </div>
          <div className="md:col-span-3 flex flex-col">
            <div className="flex items-center my-2 gap-3">
              <div className="flex items-center bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                <StarIcon className="w-4 h-4 text-yellow-400" />
                <span className="text-slate-700 dark:text-slate-300 font-semibold ms-1 text-sm">{formatNumber(product.rating)}</span>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-3 whitespace-pre-wrap">{product.description[language]}</p>
            
            <div className="flex-grow space-y-3 my-3">
              {product.options?.map(option => (
                <div key={option.name.en}>
                  <h4 className="font-semibold mb-2 text-slate-800 dark:text-slate-100">{option.name[language]}</h4>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map(value => (
                      <button
                        key={value.name.en}
                        onClick={() => handleOptionChange(option.name.en, value.name.en)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${selectedOptions[option.name.en] === value.name.en ? 'bg-primary-500 border-primary-500 text-white shadow-md' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-primary-400 dark:hover:border-primary-500'}`}
                      >
                        {value.name[language]} {value.priceModifier > 0 && `(+${value.priceModifier.toFixed(2)})`}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center my-4">
              <h4 className="font-semibold me-4 text-slate-800 dark:text-slate-100">{t.quantity}:</h4>
              <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded-full">
                <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 py-2 text-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l-full" aria-label="Decrease quantity">-</button>
                <span className="px-4 font-bold text-lg w-12 text-center text-slate-800 dark:text-slate-100" aria-live="polite">{formatNumber(quantity)}</span>
                <button type="button" onClick={() => setQuantity(q => q + 1)} className="px-4 py-2 text-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-full" aria-label="Increase quantity">+</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700 shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="text-center sm:text-start">
            <span className="text-slate-500 dark:text-slate-400 text-sm">{t.total}</span>
            {promotion ? (
                <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                    <p className="text-xl font-extrabold text-primary-600 dark:text-primary-400">{finalTotalPrice.toFixed(2)} {t.currency}</p>
                    <p className="text-base line-through text-slate-500 dark:text-slate-400 font-normal">{originalTotalPrice.toFixed(2)} {t.currency}</p>
                </div>
            ) : (
                <p className="text-xl font-extrabold text-primary-600 dark:text-primary-400">{finalTotalPrice.toFixed(2)} {t.currency}</p>
            )}
          </div>
          <button onClick={handleAddToCart} className="w-full sm:w-auto bg-primary-500 text-white font-bold py-2.5 px-5 rounded-lg hover:bg-primary-600 flex items-center justify-center gap-2 transition-all text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800 shadow-lg hover:shadow-xl transform hover:scale-105">
            <PlusIcon className="w-5 h-5" />
            {t.addToCart}
          </button>
        </div>
      </div>
    </Modal>
  );
};