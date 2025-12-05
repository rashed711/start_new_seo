
import React from 'react';
import type { Permission } from '../types';
import { translations } from '../i18n/translations';
import {
  ClipboardListIcon,
  CashRegisterIcon,
  ChartBarIcon,
  CollectionIcon,
  BookmarkAltIcon,
  TagIcon,
  UsersIcon,
  ShieldCheckIcon,
  CogIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  TruckIcon,
  UserIcon,
  BellIcon,
  BankIcon,
  // New Icon
  ArchiveIcon,
} from '../components/icons/Icons';

// A simple placeholder for icons that might not exist yet
// FIX: Rewrote the component to explicitly return React.ReactElement to avoid potential JSX parsing issues.
const PlaceholderIcon = ({className}: {className?: string}): React.ReactElement => {
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file.
    return React.createElement('div', { className: `w-5 h-5 bg-slate-300 rounded ${className}` });
};


// Define a type for translation keys to ensure type safety
type TranslationKey = keyof typeof translations['en'];

// Structure for grouping permissions in the UI
export interface PermissionGroup {
  nameKey: TranslationKey;
  icon: React.FC<any>; // Add icon property
  permissions: PermissionInfo[];
}

interface PermissionInfo {
  id: Permission;
  nameKey: TranslationKey;
}

// Static permissions grouped by page/feature for a clearer UI
export const PERMISSION_GROUPS: Record<string, PermissionGroup> = {
  operations: {
    nameKey: 'permission_group_operations',
    icon: ClipboardListIcon,
    permissions: [
      { id: 'view_orders_page', nameKey: 'permission_view_orders_page' },
      { id: 'manage_order_status', nameKey: 'permission_manage_order_status' },
      { id: 'edit_order_content', nameKey: 'permission_edit_order_content' },
      { id: 'delete_order', nameKey: 'permission_delete_order' },
      { id: 'edit_recorded_payment', nameKey: 'permission_edit_recorded_payment' },
      { id: 'view_delivery_orders', nameKey: 'permission_view_delivery_orders' },
      { id: 'view_dine_in_orders', nameKey: 'permission_view_dine_in_orders' },
      { id: 'view_takeaway_orders', nameKey: 'permission_view_takeaway_orders' },
    ],
  },
  reports: {
    nameKey: 'reports',
    icon: ChartBarIcon,
    permissions: [
      { id: 'view_reports_page', nameKey: 'permission_view_reports_page' },
      { id: 'view_sales_report', nameKey: 'permission_view_sales_report' },
      { id: 'view_orders_report', nameKey: 'permission_view_orders_report' },
      { id: 'view_profit_report', nameKey: 'permission_view_profit_report' },
      { id: 'view_customers_report', nameKey: 'permission_view_customers_report' },
      { id: 'view_products_report', nameKey: 'permission_view_products_report' },
      { id: 'view_payments_report', nameKey: 'permission_view_payments_report' },
      { id: 'view_delivery_report', nameKey: 'permission_view_delivery_report' },
      { id: 'view_user_activity_report', nameKey: 'permission_view_user_activity_report' },
    ],
  },
  financials: {
    nameKey: 'permission_group_financials',
    icon: BankIcon,
    permissions: [
        { id: 'view_treasury_page', nameKey: 'permission_view_treasury_page' },
        { id: 'add_manual_transaction', nameKey: 'permission_add_manual_transaction' },
        { id: 'manage_treasuries', nameKey: 'permission_manage_treasuries' },
        { id: 'manage_suppliers', nameKey: 'permission_manage_suppliers' },
        { id: 'add_purchase_invoice', nameKey: 'permission_add_purchase_invoice' },
        { id: 'manage_sales_invoices', nameKey: 'permission_manage_sales_invoices' },
    ]
  },
  management: {
    nameKey: 'permission_group_management',
    icon: CollectionIcon,
    permissions: [
      { id: 'view_products_page', nameKey: 'permission_view_products_page' },
      { id: 'add_product', nameKey: 'permission_add_product' },
      { id: 'edit_product', nameKey: 'permission_edit_product' },
      { id: 'delete_product', nameKey: 'permission_delete_product' },
      { id: 'view_classifications_page', nameKey: 'permission_view_classifications_page' },
      { id: 'add_category', nameKey: 'permission_add_category' },
      { id: 'edit_category', nameKey: 'permission_edit_category' },
      { id: 'delete_category', nameKey: 'permission_delete_category' },
      { id: 'add_tag', nameKey: 'permission_add_tag' },
      { id: 'edit_tag', nameKey: 'permission_edit_tag' },
      { id: 'delete_tag', nameKey: 'permission_delete_tag' },
      { id: 'view_promotions_page', nameKey: 'permission_view_promotions_page' },
      { id: 'add_promotion', nameKey: 'permission_add_promotion' },
      { id: 'edit_promotion', nameKey: 'permission_edit_promotion' },
      { id: 'delete_promotion', nameKey: 'permission_delete_promotion' },
    ],
  },
  administration: {
    nameKey: 'permission_group_administration',
    icon: UsersIcon,
    permissions: [
      { id: 'view_users_page', nameKey: 'permission_view_users_page' },
      { id: 'add_user', nameKey: 'permission_add_user' },
      { id: 'edit_user', nameKey: 'permission_edit_user' },
      { id: 'delete_user', nameKey: 'permission_delete_user' },
      { id: 'view_roles_page', nameKey: 'permission_view_roles_page' },
      { id: 'add_role', nameKey: 'permission_add_role' },
      { id: 'edit_role', nameKey: 'permission_edit_role' },
      { id: 'delete_role', nameKey: 'permission_delete_role' },
      { id: 'manage_permissions', nameKey: 'permission_manage_permissions' },
    ],
  },
  settings: {
    nameKey: 'settings',
    icon: CogIcon,
    permissions: [
        { id: 'view_settings_page', nameKey: 'permission_view_settings_page' },
        { id: 'manage_settings_general', nameKey: 'permission_manage_settings_general' },
        { id: 'manage_settings_social', nameKey: 'permission_manage_settings_social' },
        { id: 'manage_settings_statuses', nameKey: 'permission_manage_settings_statuses' },
        { id: 'manage_settings_payments', nameKey: 'permission_manage_settings_payments' },
        { id: 'manage_settings_activation', nameKey: 'permission_manage_settings_activation' },
    ],
  },
};
