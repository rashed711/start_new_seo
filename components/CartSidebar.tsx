
import React from 'react';
import ReactDOM from 'react-dom';
import type { CartItem, Language, OrderType, RestaurantInfo } from '../types';
import { CartContents } from './CartContents';
import { useCart } from '../contexts/CartContext';
import { useUI } from '../contexts/UIContext';
import { useData } from '../contexts/DataContext';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = (props) => {
  const { isOpen, onClose } = props;

  const portalRoot = document.getElementById('portal-root');
  if (!portalRoot) return null;

  const openClasses = 'translate-y-0 md:translate-x-0';
  const closedClasses = 'translate-y-full md:translate-y-0 md:translate-x-full';

  return ReactDOM.createPortal(
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`fixed bottom-0 inset-x-0 md:top-0 md:right-0 md:inset-x-auto w-full md:max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out rounded-t-2xl md:rounded-none max-h-[85vh] md:max-h-full ${
          isOpen ? openClasses : closedClasses
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-heading"
      >
        <CartContents isSidebar={true} onClose={onClose} />
      </div>
    </>,
    portalRoot
  );
};