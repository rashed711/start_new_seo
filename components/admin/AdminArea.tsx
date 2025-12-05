
import React, { useEffect } from 'react';
import { UserManagementProvider } from '../../contexts/UserManagementContext';
import { InventoryProvider } from '../../contexts/InventoryContext';
import { TreasuryProvider } from '../../contexts/TreasuryContext';
import { AdminPage } from './AdminPage';
import { useOrders } from '../../contexts/OrderContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useTreasury } from '../../contexts/TreasuryContext';

interface AdminAreaProps {
    activeSubRoute: string;
    reportSubRoute?: string;
}

const CallbackInjector: React.FC = () => {
    const { _setRefetchCallbacks } = useOrders();
    const { fetchInventoryData } = useInventory();
    const { fetchTreasuryData } = useTreasury();

    useEffect(() => {
        if (_setRefetchCallbacks) {
            _setRefetchCallbacks({
                refetchInventory: fetchInventoryData,
                refetchTreasury: fetchTreasuryData,
            });
        }

        return () => {
            if (_setRefetchCallbacks) {
                _setRefetchCallbacks({
                    refetchInventory: () => Promise.resolve(),
                    refetchTreasury: () => Promise.resolve(),
                });
            }
        };
    }, [_setRefetchCallbacks, fetchInventoryData, fetchTreasuryData]);

    return null; 
}


const AdminArea: React.FC<AdminAreaProps> = ({ activeSubRoute, reportSubRoute }) => {
    return (
        <UserManagementProvider>
            <TreasuryProvider>
                <InventoryProvider>
                    <CallbackInjector />
                    <AdminPage activeSubRoute={activeSubRoute} reportSubRoute={reportSubRoute} />
                </InventoryProvider>
            </TreasuryProvider>
        </UserManagementProvider>
    );
};

export default AdminArea;