import React, { useState, useEffect, useMemo, useSyncExternalStore, useCallback } from 'react';
// FIX: Import the 'Product' type to resolve 'Cannot find name' errors.
import type { Product } from '../types';
import { Header } from './Header';
import { Footer } from './Footer';
import { useData } from '../contexts/DataContext';
import { useCart } from '../contexts/CartContext';
import { useUI } from '../contexts/UIContext';
import { formatNumber, getActivePromotionForProduct } from '../utils/helpers';
import { StarIcon, PlusIcon, MinusIcon } from './icons/Icons';
import { ProductList } from './ProductList';
import { CartSidebar } from './CartSidebar';
import { LoadingOverlay } from './LoadingOverlay';

// Helper to subscribe to hash changes
function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

// Helper to get current hash
function getSnapshot() {
  return window.location.hash;
}

// Custom hook to parse product ID from hash
const useProductId = (): number | null => {
  const hash = useSyncExternalStore(subscribe, getSnapshot, () => window.location.hash);
  const match = hash.match(/^#\/product\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};


export const ProductPage: React.FC = () => {
    const { t, language } = useUI();
    const productId = useProductId();
    const { products, promotions, restaurantInfo } = useData();
    const { addToCart } = useCart();
    
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    const product = useMemo(() => products.find(p => p.id === productId), [products, productId]);
    
    // Set default options when the product is loaded
    useEffect(() => {
        if (product?.options) {
            const defaultOptions: { [key: string]: string } = {};
            product.options.forEach(option => {
                if (option.values.length > 0) {
                    defaultOptions[option.name.en] = option.values[0].name.en;
                }
            });
            setSelectedOptions(defaultOptions);
        }
        setQuantity(1); // Reset quantity
        setIsImageLoaded(false); // Reset image load state
        window.scrollTo(0, 0); // Scroll to top on product change
    }, [product]);

    const handleOptionChange = (optionKey: string, valueKey: string) => {
        setSelectedOptions(prev => ({ ...prev, [optionKey]: valueKey }));
    };

    const handleAddToCart = () => {
        if (product) {
            addToCart(product, quantity, selectedOptions);
            setIsCartOpen(true); // Open cart after adding
        }
    };
    
    const promotion = useMemo(() => product ? getActivePromotionForProduct(product.id, promotions) : null, [product, promotions]);

    const unitPrice = useMemo(() => {
        if (!product) return 0;
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
        if (!promotion) return unitPrice;
        return unitPrice * (1 - promotion.discountPercent / 100);
    }, [unitPrice, promotion]);

    const finalTotalPrice = discountedUnitPrice * quantity;

    const popularProducts = useMemo(() => {
        return products
            .filter(p => p.isVisible && p.isPopular && p.id !== productId)
            .slice(0, 8);
    }, [products, productId]);

    const handleProductClick = useCallback((product: Product) => {
        window.location.hash = `#/product/${product.id}`;
    }, []);

    const handleAddToCartFromList = useCallback((product: Product, quantity: number, options?: { [key: string]: string }) => {
        addToCart(product, quantity, options);
    }, [addToCart]);

    if (!restaurantInfo) {
        return <LoadingOverlay isVisible={true} />;
    }

    if (!product) {
        // Product Not Found View
        return (
            <>
                <Header onCartClick={() => setIsCartOpen(true)} />
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">Product Not Found</h1>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Sorry, we couldn't find the product you're looking for.</p>
                    <a href="#/" onClick={(e) => { e.preventDefault(); window.location.hash = '#/'; }} className="mt-6 bg-primary-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-700">
                        Back to Menu
                    </a>
                </div>
                <Footer />
            </>
        );
    }
    
    return (
        <div className="bg-slate-50 dark:bg-slate-950">
            <Header onCartClick={() => setIsCartOpen(true)} />
            
            <main className="container mx-auto max-w-7xl px-4 py-8 md:py-12 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        {/* Image Column */}
                        <div className="lg:col-span-2">
                            <div className="relative aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg">
                                {!isImageLoaded && <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse"></div>}
                                <img 
                                  src={product.image} 
                                  alt={product.name[language]} 
                                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`} 
                                  onLoad={() => setIsImageLoaded(true)}
                                />
                            </div>
                        </div>

                        {/* Details Column */}
                        <div className="lg:col-span-3 flex flex-col">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-50 mb-2">{product.name[language]}</h1>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    <StarIcon className="w-5 h-5 text-yellow-400" />
                                    <span>{formatNumber(product.rating)}</span>
                                </div>
                                <span className="text-slate-400">·</span>
                                <span className="text-sm font-medium text-slate-500">{product.code}</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 mb-6 whitespace-pre-wrap">{product.description[language]}</p>
                            
                            {/* Options */}
                            <div className="space-y-5 mb-6">
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
                                                    {value.name[language]} {value.priceModifier !== 0 && `(${value.priceModifier > 0 ? '+' : ''}${value.priceModifier.toFixed(2)})`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Actions and Price */}
                            <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                                    {/* Quantity Selector */}
                                    <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded-full">
                                        <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-5 py-3 text-2xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l-full transition-colors" aria-label="Decrease quantity">-</button>
                                        <span className="px-5 font-bold text-lg w-16 text-center text-slate-800 dark:text-slate-100" aria-live="polite">{formatNumber(quantity)}</span>
                                        <button type="button" onClick={() => setQuantity(q => q + 1)} className="px-5 py-3 text-2xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-full transition-colors" aria-label="Increase quantity">+</button>
                                    </div>
                                    
                                    {/* Price and Add to Cart */}
                                    <div className="flex items-center gap-4 flex-grow">
                                        <div className="text-right flex-grow">
                                            <span className="text-slate-500 dark:text-slate-400 text-sm">{t.total}</span>
                                            {promotion ? (
                                                <div className="flex items-baseline gap-2 justify-end">
                                                    <p className="text-3xl font-extrabold text-primary-600 dark:text-primary-400">{finalTotalPrice.toFixed(2)}</p>
                                                    <p className="text-lg line-through text-slate-500 dark:text-slate-400 font-normal">{(unitPrice * quantity).toFixed(2)}</p>
                                                </div>
                                            ) : (
                                                <p className="text-3xl font-extrabold text-primary-600 dark:text-primary-400">{finalTotalPrice.toFixed(2)}</p>
                                            )}
                                        </div>
                                        <button onClick={handleAddToCart} className="bg-primary-500 text-white font-bold py-3 px-5 rounded-lg hover:bg-primary-600 flex items-center justify-center gap-2 transition-all text-base shadow-lg hover:shadow-xl transform hover:scale-105">
                                            <PlusIcon className="w-6 h-6" />
                                            {t.addToCart}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {popularProducts.length > 0 && (
                    <div className="mt-16">
                         <ProductList 
                            titleKey="mostPopular" 
                            products={popularProducts} 
                            onProductClick={handleProductClick} 
                            addToCart={handleAddToCartFromList}
                            slider={true}
                            promotions={promotions.filter(p => p.isActive)}
                        />
                    </div>
                )}
            </main>
            
            <Footer />

            <CartSidebar
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
            />
        </div>
    );
};

export default ProductPage;