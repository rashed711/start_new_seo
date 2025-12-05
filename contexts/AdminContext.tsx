import React, { createContext, useContext } from 'react';

// THIS FILE IS DEPRECATED AND WILL BE REMOVED.
// Its functionality has been split into:
// - OrderContext
// - UserManagementContext
// - InventoryContext
// - DataContext (for product/category/tag/promotion management)
// All components have been updated to use the new hooks. This file remains as a shell
// during the transition and will be removed in a future cleanup.

console.warn(
  "AdminContext is deprecated and its provider is now a pass-through. " +
  "The useAdmin() hook will return an empty object. " +
  "Please migrate all components to use the new specialized hooks: " +
  "useOrders, useUserManagement, useInventory, and useData."
);

const AdminContext = createContext<any | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <AdminContext.Provider value={{}}>{children}</AdminContext.Provider>;
};

export const useAdmin = (): any => {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
};
