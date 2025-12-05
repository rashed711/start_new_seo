import React, { useState } from 'react';
import type { Product, Language, Promotion } from '../types';
import { useUI } from '../contexts/UIContext';
import { StarIcon, PlusIcon } from './icons/Icons';
import { formatNumber, getActivePromotionForProduct } from '../utils/helpers';

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
  addToCart: (product: Product, quantity: number, options?: { [key: string]: string }) => void;
  promotions: Promotion[];
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onProductClick, addToCart, promotions }) => {
  const { t, language } = useUI();
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const promotion = getActivePromotionForProduct(product.id, promotions);
  const discountedPrice = promotion ? product.price * (1 - promotion.discountPercent / 100) : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.options && product.options.length > 0) {
        onProductClick(product);
    } else {
        addToCart(product, 1);
    }
  };

  return (
    <div 
      onClick={() => onProductClick(product)}
      className="relative group bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col h-full"
    >
      <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-700">
        {!isImageLoaded && <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse"></div>}
        <img 
          src={product.image} 
          alt={product.name[language]} 
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 group-hover:scale-110 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`} 
          loading="lazy"
          onLoad={() => setIsImageLoaded(true)}
        />
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight mb-1">{product.name[language]}</h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 flex-grow">{product.description[language]}</p>
        <div className="flex items-center justify-between mt-2">
            <div>
                {discountedPrice !== null ? (
                    <>
                        <p className="text-base sm:text-lg font-extrabold text-primary-600 dark:text-primary-400">{formatNumber(discountedPrice)} {t.currency}</p>
                        <p className="text-xs sm:text-sm line-through text-slate-500 dark:text-slate-400 -mt-1">{formatNumber(product.price)} {t.currency}</p>
                    </>
                ) : (
                    <p className="text-base sm:text-lg font-extrabold text-primary-600 dark:text-primary-400">{formatNumber(product.price)} {t.currency}</p>
                )}
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <StarIcon className="w-4 h-4 text-yellow-400" />
                <span>{formatNumber(product.rating)}</span>
            </div>
        </div>

        <div className="mt-4">
            <button 
                onClick={handleAddToCart} 
                className="w-full bg-primary-500 text-white font-bold text-sm py-2 px-4 rounded-lg hover:bg-primary-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-px" 
                aria-label={t.addToCart}
            >
                <PlusIcon className="w-5 h-5" />
                {t.addToCart}
            </button>
        </div>
      </div>
      <div className="absolute top-2 left-2 flex flex-col gap-2">
        {promotion && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
                -{formatNumber(promotion.discountPercent)}%
            </span>
        )}
        {product.isNew && (
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
                {t.newItem}
            </span>
        )}
        {product.isPopular && (
             <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md flex items-center gap-1">
                <StarIcon className="w-3 h-3"/> {t.popular}
            </span>
        )}
      </div>
    </div>
  );
});