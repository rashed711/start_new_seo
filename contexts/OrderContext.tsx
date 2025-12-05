
import React, { createContext, useState, useCallback, useContext, useEffect, useRef } from 'react';
import type { Order, CartItem, RestaurantInfo } from '../types';
import { APP_CONFIG } from '../utils/config';
import { useUI } from './UIContext';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { calculateTotal, resolveImageUrl } from '../utils/helpers';
import { usePersistentState } from '../hooks/usePersistentState';


interface OrderContextType {
    orders: Order[];
    isOrdersLoading: boolean;
    placeOrder: (order: Omit<Order, 'id' | 'timestamp'>) => Promise<Order>;
    updateOrder: (orderId: string, payload: Partial<Omit<Order, 'id' | 'timestamp' | 'customer'>>) => Promise<void>;
    deleteOrder: (orderId: string) => Promise<boolean>;
    viewingOrder: Order | null;
    setViewingOrder: React.Dispatch<React.SetStateAction<Order | null>>;
    refusingOrder: Order | null;
    setRefusingOrder: React.Dispatch<React.SetStateAction<Order | null>>;
    _setRefetchCallbacks: (callbacks: { refetchInventory: () => Promise<void>, refetchTreasury: () => Promise<void> }) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Base64 encoded public domain notification sound to prevent pathing issues.
const notificationSoundDataUri = 'data:audio/mpeg;base64,SUQzBAAAAAAAIBAFVVTEQAAAACAAADSAAAAAP8A/i4ADgAQAFhZWU5DAAAABAAD//wDE5/naa4f1eA4yAABJIIAA3/s/y3P+Yf5v/w7/AP/t/wH/1v+f/qP/kv+j/wH/rv+V/zL/AP/T/2P+Y/5j/w7+AP/q/wL/rv/D/zX/AP/b/wH+Y/5T/w3/AP/r/wP/sP/H/zL/AP/a/wL+Y/5T/w3/AP/q/wP/sP/F/zL/AP/W/wH/Y/5j/w7/AP/q/wP/sP+///8A';

// FIX: Wrap logic in a provider component and export it.
export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // FIX: All hooks and state logic moved inside the provider.
    const { setIsLoading, showToast, t, isProcessing, setIsProcessing } = useUI();
    const { currentUser, hasPermission } = useAuth();
    const { restaurantInfo, products, fetchAllData: refetchData } = useData();
    
    const [orders, setOrders] = useState<Order[]>([]);
    const [isOrdersLoading, setIsOrdersLoading] = useState(true);
    
    // For modals
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [refusingOrder, setRefusingOrder] = useState<Order | null>(null);

    const [isSoundEnabled] = usePersistentState<boolean>('admin_sound_enabled', true);
    const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
    const lastPlayedForOrder = useRef<Set<string>>(new Set());
    const lastPlayedForStatus = useRef<Map<string, string>>(new Map());

    const refetchCallbacks = useRef({
        refetchInventory: () => Promise.resolve(),
        refetchTreasury: () => Promise.resolve(),
    });

    const _setRefetchCallbacks = useCallback((callbacks: { refetchInventory: () => Promise<void>, refetchTreasury: () => Promise<void> }) => {
        refetchCallbacks.current = callbacks;
    }, []);

    // Effect to create the audio object
    useEffect(() => {
        const audio = new Audio(notificationSoundDataUri);
        audio.preload = 'auto';
        notificationAudioRef.current = audio;
    }, []);

    // Effect to play notification sound
    useEffect(() => {
        if (!isSoundEnabled || isOrdersLoading || !restaurantInfo || !notificationAudioRef.current) return;

        const soundStatuses = new Set(
            restaurantInfo.orderStatusColumns
                .filter(col => col.playSound)
                .map(col => col.id)
        );

        if (soundStatuses.size === 0) return;

        orders.forEach(order => {
            const shouldPlay = soundStatuses.has(order.status);
            const alreadyPlayedForThisStatus = lastPlayedForStatus.current.get(order.id) === order.status;

            if (shouldPlay && !alreadyPlayedForThisStatus) {
                console.log(`Playing sound for order ${order.id} with status ${order.status}`);
                notificationAudioRef.current?.play().catch(e => console.error("Audio play failed:", e));
                lastPlayedForStatus.current.set(order.id, order.status);
            }
        });
    }, [orders, isSoundEnabled, isOrdersLoading, restaurantInfo]);
    
    // Fetch orders periodically
    useEffect(() => {
        let isMounted = true;
        const fetchOrders = async () => {
            // FIX: Removed hasPermission check. The backend should handle authorization.
            // If a user is logged in, they should always be able to fetch their own orders.
            if (!currentUser) {
                setOrders([]);
                setIsOrdersLoading(false);
                return;
            }
            try {
                // The backend (get_orders.php) is expected to check the session
                // and return all orders for an admin, or just the user's orders for a customer.
                const response = await fetch(`${APP_CONFIG.API_BASE_URL}get_orders.php`);
                if (response.ok && isMounted) {
                    const data = await response.json();
                    setOrders(data || []);
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                if (isMounted) setIsOrdersLoading(false);
            }
        };

        fetchOrders(); // Initial fetch
        const interval = setInterval(fetchOrders, 10000); // Poll every 10 seconds

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [currentUser]); // FIX: Removed hasPermission from dependency array


    const placeOrder = useCallback(async (order: Omit<Order, 'id' | 'timestamp'>): Promise<Order> => {
        // If a user is logged in at the moment of placing the order,
        // ensure their ID and details are authoritative, overwriting any
        // stale data that might have come from a pre-login form state.
        // This directly fixes the race condition with Google Sign-In.
        if (currentUser) {
            order.customer.userId = currentUser.id;
            order.customer.name = currentUser.name;
            order.customer.mobile = currentUser.mobile;
            order.createdBy = currentUser.id;
        }

        setIsProcessing(true);
        try {
            const payload = {
                ...order,
                id: `ORD-${Date.now()}`,
            };
            
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_order.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to place order.');
            }
            
            // Refetch inventory and treasury data after successful order
            await Promise.all([
                refetchCallbacks.current.refetchInventory(),
                refetchCallbacks.current.refetchTreasury()
            ]);

            return result.order;
        } finally {
            setIsProcessing(false);
        }
    }, [setIsProcessing, currentUser, refetchCallbacks]);
    
    const updateOrder = useCallback(async (orderId: string, payload: Partial<Omit<Order, 'id' | 'timestamp' | 'customer'>>) => {
        const originalOrder = orders.find(o => o.id === orderId);
        if (!originalOrder) return;
        
        // Optimistic update
        // Ensure updatedOrder has the correct structure by explicitly merging payload
        const updatedOrder = { ...originalOrder, ...payload };
        
        // Update the list
        setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        
        // Synchronously update viewingOrder to match the updated list item
        // This forces the UI (OrderDetailsModal) to reflect changes immediately, including total
        setViewingOrder(current => (current?.id === orderId ? updatedOrder : current));
        
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_order.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderId, payload: payload })
            });

            if (!response.ok) {
                 const errorText = await response.text();
                 console.error("Update order failed with status:", response.status, errorText);
                 throw new Error(t.orderUpdateFailed);
            }
            
            const result = await response.json();
            if(!result.success) {
                console.error("Update order API returned failure:", result.error);
                throw new Error(result.error || t.orderUpdateFailed);
            }

            // If status changed to/from 'completed', it affects stock, sales invoices, and treasury. Refetch all relevant data.
            if ('status' in payload && (payload.status === 'completed' || originalOrder.status === 'completed')) {
                await Promise.all([
                    refetchData(),
                    refetchCallbacks.current.refetchTreasury(),
                    refetchCallbacks.current.refetchInventory()
                ]);
            }

            showToast(t.orderUpdatedSuccess);
        } catch (error: any) {
            // Revert optimistic update
            setOrders(prev => prev.map(o => o.id === orderId ? originalOrder : o));
            // Revert viewingOrder
            setViewingOrder(current => (current?.id === orderId ? originalOrder : current));
            
            showToast(error.message || t.orderUpdateFailed);
        } finally {
            setIsProcessing(false);
        }
    }, [orders, t, showToast, setIsProcessing, refetchData]);
    
    const deleteOrder = useCallback(async (orderId: string): Promise<boolean> => {
        if (!hasPermission('delete_order') || !window.confirm(t.confirmDeleteOrder)) return false;
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}delete_order.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId })
            });
            // FIX: Corrected translation key
            if (!response.ok || !(await response.json()).success) throw new Error(t.orderDeleteFailed);
            setOrders(prev => prev.filter(o => o.id !== orderId));
            
            // Close the viewing modal if the deleted order was being viewed
            setViewingOrder(current => (current && current.id === orderId ? null : current));

            showToast(t.orderDeletedSuccess);
            return true;
        } catch (error: any) {
            // FIX: Corrected translation key
            showToast(error.message || t.orderDeleteFailed);
            return false;
        } finally {
            setIsProcessing(false);
        }
    }, [hasPermission, t, showToast, setIsProcessing]);
    
    const value: OrderContextType = {
        orders,
        isOrdersLoading,
        placeOrder,
        updateOrder,
        deleteOrder,
        viewingOrder, setViewingOrder,
        refusingOrder, setRefusingOrder,
        _setRefetchCallbacks
    };
    
    return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

// FIX: Add the missing custom hook export.
export const useOrders = () => {
    const context = useContext(OrderContext);
    if (context === undefined) {
        throw new Error('useOrders must be used within an OrderProvider');
    }
    return context;
};
