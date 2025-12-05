
import React, { useState, useMemo } from 'react';
import type { Order, Language, CartItem, Product } from '../../types';
import { PlusIcon, TrashIcon, MinusIcon } from '../icons/Icons';
import { ProductModal } from '../ProductModal';
import { Modal } from '../Modal';
import { useUI } from '../../contexts/UIContext';
import { useData } from '../../contexts/DataContext';
import { calculateItemTotal } from '../../utils/helpers';

interface OrderEditModalProps {
    order: Order;
    onClose: () => void;
    onSave: (updatedOrderData: {items: CartItem[], notes: string, total: number, tableNumber?: string}) => void;
}

export const OrderEditModal: React.FC<OrderEditModalProps> = ({ order, onClose, onSave }) => {
    const { language, t } = useUI();
    const { products: allProducts, promotions } = useData();
    
    const [editedItems, setEditedItems] = useState<CartItem[]>(() => JSON.parse(JSON.stringify(order.items)));
    const [notes, setNotes] = useState(order.notes || '');
    const [tableNumber, setTableNumber] = useState(order.tableNumber || '');
    const [productToAdd, setProductToAdd] = useState<string>(allProducts[0]?.id.toString() || '');
    const [addingProductWithOptions, setAddingProductWithOptions] = useState<Product | null>(null);

    const total = useMemo(() => {
        return editedItems.reduce((acc, item) => acc + calculateItemTotal(item), 0);
    }, [editedItems]);

    const handleQuantityChange = (itemIndex: number, newQuantity: number) => {
        if (newQuantity < 1) {
            handleRemoveItem(itemIndex);
            return;
        };
        setEditedItems(prev => prev.map((item, index) => index === itemIndex ? { ...item, quantity: newQuantity } : item));
    };

    const handleRemoveItem = (itemIndex: number) => {
        setEditedItems(prev => prev.filter((_, index) => index !== itemIndex));
    };

    const handleAddItem = () => {
        const product = allProducts.find(p => p.id === parseInt(productToAdd, 10));
        if (!product) return;

        if (product.options && product.options.length > 0) {
            setAddingProductWithOptions(product);
        } else {
             const newItem: CartItem = { product, quantity: 1 };
             setEditedItems(prev => [...prev, newItem]);
        }
    };

     const handleAddFromModal = (product: Product, quantity: number, options?: { [key: string]: string }) => {
        const itemVariantId = product.id + JSON.stringify(options || {});
        const existingItemIndex = editedItems.findIndex(item => (item.product.id + JSON.stringify(item.options || {})) === itemVariantId);

        if (existingItemIndex > -1) {
            setEditedItems(prev => prev.map((item, index) => 
                index === existingItemIndex ? { ...item, quantity: item.quantity + quantity } : item
            ));
        } else {
            const newItem: CartItem = { product, quantity, options };
            setEditedItems(prev => [...prev, newItem]);
        }
        setAddingProductWithOptions(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Calculate total explicitly on submit to ensure accuracy
        const currentTotal = editedItems.reduce((acc, item) => acc + calculateItemTotal(item), 0);
        onSave({ 
            items: editedItems, 
            notes, 
            total: currentTotal, 
            tableNumber: order.orderType === 'Dine-in' ? tableNumber : undefined 
        });
    };

    return (
        <>
            <Modal title={`${t.editOrder} - ${order.id}`} onClose={onClose} size="2xl">
                <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden h-full">
                    <div className="p-5 space-y-4 overflow-y-auto flex-grow">
                        {order.orderType === 'Dine-in' && (
                            <div>
                                <label className="block text-lg font-bold mb-2">{t.tableNumber}</label>
                                <input
                                    type="text"
                                    value={tableNumber}
                                    onChange={(e) => setTableNumber(e.target.value)}
                                    placeholder={t.enterTableNumber}
                                    className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        )}

                        {/* Items List */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-lg">{t.orderItems}</h3>
                            {editedItems.map((item, index) => (
                                <div key={index} className="flex items-center gap-4 p-2 rounded-md bg-slate-50 dark:bg-slate-700/50">
                                    <img src={item.product.image} alt={item.product.name[language]} className="w-12 h-12 rounded-md object-cover" />
                                    <div className="flex-grow">
                                        <p className="font-semibold">{item.product.name[language]}</p>
                                    </div>
                                    <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded-full">
                                        <button type="button" onClick={() => handleQuantityChange(index, item.quantity - 1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l-full" aria-label="Decrease quantity">
                                            <MinusIcon className="w-4 h-4" />
                                        </button>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleQuantityChange(index, parseInt(e.target.value, 10) || 1)}
                                            className="w-12 p-1 text-center bg-transparent border-x dark:border-slate-600 dark:text-slate-100 focus:outline-none appearance-none [-moz-appearance:textfield]"
                                            min="1"
                                        />
                                        <button type="button" onClick={() => handleQuantityChange(index, item.quantity + 1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-full" aria-label="Increase quantity">
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Item Section */}
                        <div className="pt-4 border-t dark:border-slate-700">
                            <div className="flex items-center gap-4">
                                <select
                                    value={productToAdd}
                                    onChange={(e) => setProductToAdd(e.target.value)}
                                    className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                                >
                                    {allProducts.map(p => <option key={p.id} value={p.id}>{p.name[language]}</option>)}
                                </select>
                                <button type="button" onClick={handleAddItem} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 whitespace-nowrap">
                                    <PlusIcon className="w-5 h-5" />
                                    {t.addItem}
                                </button>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div>
                            <label className="block text-lg font-bold mb-2">{t.orderNotes}</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                                className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>

                    <div className="p-4 mt-auto flex justify-between items-center border-t border-gray-200 dark:border-gray-700 shrink-0">
                        <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{t.total}</span>
                            <p className="font-extrabold text-xl text-primary-600 dark:text-primary-400">{total.toFixed(2)} {t.currency}</p>
                        </div>
                        <div className="flex gap-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold text-slate-800 dark:text-slate-300 transition-colors">{t.cancel}</button>
                            <button type="submit" className="px-6 py-2 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-colors">{t.saveChanges}</button>
                        </div>
                    </div>
                </form>
            </Modal>
             {addingProductWithOptions && (
                <ProductModal
                    product={addingProductWithOptions}
                    onClose={() => setAddingProductWithOptions(null)}
                    addToCart={handleAddFromModal}
                    promotions={promotions}
                />
            )}
        </>
    );
};
