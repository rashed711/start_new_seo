import React, { createContext, useCallback, useContext } from 'react';
import type { Product, CartItem } from '../types';
import { usePersistentState } from '../hooks/usePersistentState';
import { useUI } from './UIContext';
import { useData } from './DataContext';
import { getActivePromotionForProduct } from '../utils/helpers';

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: Product, quantity: number, options?: { [key: string]: string }) => void;
    updateCartQuantity: (productId: number, options: { [key: string]: string } | undefined, newQuantity: number) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { showToast, t } = useUI();
    const { promotions } = useData();
    const [cartItems, setCartItems] = usePersistentState<CartItem[]>('restaurant_cart', []);

    const addToCart = useCallback((product: Product, quantity: number, options?: { [key: string]: string }) => {
        setCartItems(prevItems => {
          const itemVariantId = product.id + JSON.stringify(options || {});
          const existingItem = prevItems.find(item => (item.product.id + JSON.stringify(item.options || {})) === itemVariantId);
          
          if (existingItem) {
            return prevItems.map(item =>
              (item.product.id + JSON.stringify(item.options || {})) === itemVariantId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          }
          const promotion = getActivePromotionForProduct(product.id, promotions);
          const newItem: CartItem = { 
              product, 
              quantity, 
              options,
              appliedDiscountPercent: promotion ? promotion.discountPercent : undefined
          };
          return [...prevItems, newItem];
        });
        showToast(t.addedToCart);
    }, [showToast, t.addedToCart, setCartItems, promotions]);
    
    const updateCartQuantity = useCallback((productId: number, options: { [key: string]: string } | undefined, newQuantity: number) => {
        const itemVariantId = productId + JSON.stringify(options || {});
        setCartItems(prevItems => {
          if (newQuantity <= 0) {
            return prevItems.filter(item => (item.product.id + JSON.stringify(item.options || {})) !== itemVariantId);
          }
          return prevItems.map(item =>
            (item.product.id + JSON.stringify(item.options || {})) === itemVariantId 
                ? { ...item, quantity: newQuantity } 
                : item
          );
        });
    }, [setCartItems]);

    const clearCart = useCallback(() => setCartItems([]), [setCartItems]);

    const value: CartContextType = {
        cartItems,
        addToCart,
        updateCartQuantity,
        clearCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};