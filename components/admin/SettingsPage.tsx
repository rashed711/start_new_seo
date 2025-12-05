
import React, { useState, useEffect, useMemo } from 'react';
import type { Language, Order, OrderStatusColumn, Permission, RestaurantInfo, SocialLink, OnlinePaymentMethod } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon } from '../icons/Icons';
import { SocialLinkEditModal } from './SocialLinkEditModal';
import { OrderStatusEditModal } from './OrderStatusEditModal';
import { OnlinePaymentMethodEditModal } from './OnlinePaymentMethodEditModal';
import { useUI } from '../../contexts/UIContext';
import { useData } from '../../contexts/DataContext';
import { useOrders } from '../../contexts/OrderContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/helpers';
import { useCountdown } from '../../hooks/useCountdown';
import { usePersistentState } from '../../hooks/usePersistentState';

type SettingsTab = 'general' | 'social' | 'statuses' | 'payments' | 'activation';

// A reusable Card component for consistent styling
const SettingsCard: React.FC<{ title: string, subtitle: string, children: React.ReactNode, actions?: React.ReactNode }> = ({ title, subtitle, children, actions }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
            </div>
            {actions && <div className="self-start sm:self-center">{actions}</div>}
        </div>
        <div className="p-4 sm:p-6 space-y-6">
            {children}
        </div>
    </div>
);

// A reusable Form Group component
const FormGroup: React.FC<{ label: string, children: React.ReactNode, helperText?: string }> = ({ label, children, helperText }) => (
    <div>
        <label className="block font-semibold text-sm text-slate-600 dark:text-slate-300 mb-1.5">{label}</label>
        {children}
        {helperText && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{helperText}</p>}
    </div>
);

const formatDateForInput = (isoDate: string | null | undefined): string => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    // Adjust for timezone offset to show the correct local time in the input
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().slice(0, 16);
};


export const SettingsPage: React.FC = () => {
    const { language, t, showToast } = useUI();
    const { restaurantInfo, updateRestaurantInfo } = useData();
    const { orders: allOrders } = useOrders();
    const { hasPermission } = useAuth();
    
    const [localInfo, setLocalInfo] = useState<RestaurantInfo | null>(restaurantInfo);
    const [isDirty, setIsDirty] = useState(false);
    const [editingLink, setEditingLink] = useState<SocialLink | 'new' | null>(null);
    const [editingOrderStatus, setEditingOrderStatus] = useState<OrderStatusColumn | 'new' | null>(null);
    const [editingPaymentMethod, setEditingPaymentMethod] = useState<OnlinePaymentMethod | 'new' | null>(null);
    const [isSoundEnabled, setIsSoundEnabled] = usePersistentState<boolean>('admin_sound_enabled', true);
    
    const getDefaultTab = (): SettingsTab => {
        if (hasPermission('manage_settings_general')) return 'general';
        if (hasPermission('manage_settings_social')) return 'social';
        if (hasPermission('manage_settings_statuses')) return 'statuses';
        if (hasPermission('manage_settings_payments')) return 'payments';
        if (hasPermission('manage_settings_activation')) return 'activation';
        return 'general';
    }
    const [activeTab, setActiveTab] = useState<SettingsTab>(getDefaultTab());

    useEffect(() => {
        setLocalInfo(restaurantInfo);
    }, [restaurantInfo]);

    useEffect(() => {
        if (!localInfo || !restaurantInfo) return;
        setIsDirty(JSON.stringify(localInfo) !== JSON.stringify(restaurantInfo));
    }, [localInfo, restaurantInfo]);
    
    const handleSaveChanges = () => {
        if (!localInfo || !restaurantInfo) return;

        const diff: Partial<RestaurantInfo> = {};

        // Compare each key to find differences
        for (const key in localInfo) {
            const typedKey = key as keyof RestaurantInfo;
            const localValue = localInfo[typedKey];
            const originalValue = restaurantInfo[typedKey];
            
            // Use stringify for a simple deep comparison of objects/arrays
            if (JSON.stringify(localValue) !== JSON.stringify(originalValue)) {
                (diff as any)[typedKey] = localValue;
            }
        }
        
        if (Object.keys(diff).length > 0) {
            updateRestaurantInfo(diff);
        } else {
            setIsDirty(false); // Should not happen if button is visible, but good for safety
        }
    };


    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!localInfo) return;
        const { name, value } = e.target;
        const [field, lang] = name.split('.');
        setLocalInfo(prev => prev ? ({
            ...prev,
            [field]: { ...prev[field as 'name' | 'description' | 'heroTitle' | 'codNotes' | 'onlinePaymentNotes' | 'deactivationMessage'], [lang]: value }
        }) : null);
    };

    const handleNonLocalizedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!localInfo) return;
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? (parseInt(value, 10) || 0) : value;
        setLocalInfo(prev => prev ? ({ ...prev, [name]: finalValue }) : null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'heroImage') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalInfo(prev => prev ? ({ ...prev, [field]: reader.result as string }) : null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleHomepageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalInfo(prev => prev ? ({ ...prev, defaultPage: e.target.value as 'menu' | 'social' }) : null);
    };

    const handleToggleVisibility = async (id: number, type: 'social' | 'payment') => {
        if (!restaurantInfo) return;
        const key = type === 'social' ? 'socialLinks' : 'onlinePaymentMethods';
        const updatedItems = restaurantInfo[key].map(item =>
            item.id === id ? { ...item, isVisible: !item.isVisible } : item
        );
        await updateRestaurantInfo({ [key]: updatedItems });
    };
    
    const handleDeleteLink = async (linkId: number) => {
        if (window.confirm(t.confirmDeleteLink) && restaurantInfo) {
             const updatedLinks = restaurantInfo.socialLinks.filter(link => link.id !== linkId);
             await updateRestaurantInfo({ socialLinks: updatedLinks });
        }
    };

    const handleSaveLink = async (linkData: SocialLink | Omit<SocialLink, 'id'>) => {
        if (!restaurantInfo) return;
        let updatedLinks: SocialLink[];
        if ('id' in linkData) {
            updatedLinks = restaurantInfo.socialLinks.map(link => link.id === linkData.id ? linkData : link);
        } else {
            const newLink: SocialLink = {
                ...linkData,
                id: restaurantInfo.socialLinks.length > 0 ? Math.max(...restaurantInfo.socialLinks.map(l => l.id)) + 1 : 1,
            };
            updatedLinks = [...restaurantInfo.socialLinks, newLink];
        }
        await updateRestaurantInfo({ socialLinks: updatedLinks });
        setEditingLink(null);
    };
    
    const handleDeleteStatus = async (columnId: string) => {
        if (allOrders.some(order => order.status === columnId)) {
            showToast(t.deleteStatusError);
            return;
        }
        if (window.confirm(t.confirmDeleteStatus) && restaurantInfo) {
            const updatedColumns = restaurantInfo.orderStatusColumns.filter(c => c.id !== columnId);
            await updateRestaurantInfo({ orderStatusColumns: updatedColumns });
        }
    };

    const handleSaveStatus = async (data: OrderStatusColumn) => {
        if (!restaurantInfo) return;
        let updatedColumns: OrderStatusColumn[];
        const isEditing = restaurantInfo.orderStatusColumns.some(c => c.id === data.id);
        if (isEditing) {
            updatedColumns = restaurantInfo.orderStatusColumns.map(c => c.id === data.id ? data : c);
        } else {
            updatedColumns = [...restaurantInfo.orderStatusColumns, data];
        }
        await updateRestaurantInfo({ orderStatusColumns: updatedColumns });
        setEditingOrderStatus(null);
    };

    const handleStatusSoundToggle = (columnId: string) => {
        setLocalInfo(prev => {
            if (!prev) return null;
            const updatedColumns = prev.orderStatusColumns.map(col =>
                col.id === columnId ? { ...col, playSound: !col.playSound } : col
            );
            return { ...prev, orderStatusColumns: updatedColumns };
        });
    };
    
    const handleSavePaymentMethod = async (methodData: OnlinePaymentMethod | Omit<OnlinePaymentMethod, 'id'>) => {
        if (!restaurantInfo) return;
        let updatedMethods: OnlinePaymentMethod[];
        if ('id' in methodData) {
            updatedMethods = (restaurantInfo.onlinePaymentMethods || []).map(method => method.id === methodData.id ? methodData : method);
        } else {
            const newMethod: OnlinePaymentMethod = {
                ...methodData,
                id: (restaurantInfo.onlinePaymentMethods || []).length > 0 ? Math.max(...restaurantInfo.onlinePaymentMethods.map(m => m.id)) + 1 : 1,
            };
            updatedMethods = [...(restaurantInfo.onlinePaymentMethods || []), newMethod];
        }
        await updateRestaurantInfo({ onlinePaymentMethods: updatedMethods });
        setEditingPaymentMethod(null);
    };


    const handleDeletePaymentMethod = async (methodId: number) => {
        if (window.confirm(t.confirmDeletePaymentMethod) && restaurantInfo) {
            const updatedMethods = restaurantInfo.onlinePaymentMethods.filter(method => method.id !== methodId);
            await updateRestaurantInfo({ onlinePaymentMethods: updatedMethods });
        }
    };

    const handleExtendActivation = (amount: number, unit: 'day' | 'month' | 'year') => {
        if (!localInfo) return;
        // Determine the base date for extension. Use today if expired, otherwise use the existing end date.
        const baseDate = localInfo.activationEndDate && new Date(localInfo.activationEndDate) > new Date()
            ? new Date(localInfo.activationEndDate)
            : new Date();
        
        // Set the time to the end of the day to ensure full days are counted.
        baseDate.setHours(23, 59, 59, 999);
    
        const newDate = new Date(baseDate);
        if (unit === 'day') newDate.setDate(newDate.getDate() + amount);
        if (unit === 'month') newDate.setMonth(newDate.getMonth() + amount);
        if (unit === 'year') newDate.setFullYear(newDate.getFullYear() + amount);
    
        setLocalInfo(prev => prev ? { ...prev, activationEndDate: newDate.toISOString() } : null);
    };

    const handleDeactivateNow = async () => {
        if (window.confirm(t.confirmDeactivation)) {
            await updateRestaurantInfo({ activationEndDate: new Date(0).toISOString() });
        }
    };

    if (!localInfo || !restaurantInfo) {
        return <div className="p-8 text-center">Loading settings...</div>;
    }

    const isExpired = localInfo.activationEndDate && new Date(localInfo.activationEndDate) < new Date();
    const { days, hours } = useCountdown(localInfo.activationEndDate || new Date().toISOString());

    const tabs: { id: SettingsTab; label: string; permission: Permission }[] = [
        { id: 'general', label: t.settingsTabGeneralBranding, permission: 'manage_settings_general' },
        { id: 'social', label: t.settingsTabSocial, permission: 'manage_settings_social' },
        { id: 'statuses', label: t.settingsTabStatuses, permission: 'manage_settings_statuses' },
        { id: 'payments', label: t.settingsTabPayments, permission: 'manage_settings_payments' },
        { id: 'activation', label: t.settingsTabActivation, permission: 'manage_settings_activation' },
    ];
    
    const formInputClasses = "w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 dark:bg-slate-700/50 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 shadow-sm";
    const fileInputClasses = "block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-100 file:text-primary-700 hover:file:bg-primary-200 dark:file:bg-primary-900/50 dark:file:text-primary-200 dark:hover:file:bg-primary-900 cursor-pointer";
    const btnPrimarySmClasses = "bg-primary-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-600 transition-all duration-200 flex items-center gap-2 text-sm shadow-sm hover:shadow-md transform hover:-translate-y-0.5";
    const btnIconSecondaryClasses = "p-2 text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-full transition-colors";
    const btnIconDangerClasses = "p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50 rounded-full transition-colors";

    return (
        <div className="animate-fade-in pb-20"> {/* Padding bottom to account for sticky bar */}
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-6">{t.settings}</h2>

            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-6 rtl:space-x-reverse overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => {
                        if (!hasPermission(tab.permission as Permission)) return null;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as SettingsTab)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-8">
                {activeTab === 'general' && hasPermission('manage_settings_general') && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <div className="space-y-8">
                            <SettingsCard title={t.restaurantInformation} subtitle={t.settingsInfoDescription}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormGroup label={t.productNameEn}>
                                        <input type="text" name="name.en" value={localInfo.name.en} onChange={handleInfoChange} className={formInputClasses} />
                                    </FormGroup>
                                    <FormGroup label={t.productNameAr}>
                                        <input type="text" name="name.ar" value={localInfo.name.ar} onChange={handleInfoChange} className={formInputClasses} />
                                    </FormGroup>
                                </div>
                                <hr className="border-slate-200 dark:border-slate-700"/>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormGroup label={t.descriptionEn}>
                                        <textarea name="description.en" value={localInfo.description?.en || ''} onChange={handleInfoChange} rows={3} className={formInputClasses}></textarea>
                                    </FormGroup>
                                    <FormGroup label={t.descriptionAr}>
                                        <textarea name="description.ar" value={localInfo.description?.ar || ''} onChange={handleInfoChange} rows={3} className={formInputClasses}></textarea>
                                    </FormGroup>
                                </div>
                                <hr className="border-slate-200 dark:border-slate-700"/>
                                <FormGroup label={t.whatsappNumberLabel} helperText={t.settingsWhatsappDescription}>
                                    <input type="text" name="whatsappNumber" value={localInfo.whatsappNumber || ''} onChange={handleNonLocalizedChange} className={formInputClasses} />
                                </FormGroup>
                            </SettingsCard>
                             <SettingsCard title={t.notificationSettings} subtitle="Manage sound alerts for new events.">
                                <FormGroup label={t.generalSoundNotifications} helperText={t.generalSoundNotificationsHelpText}>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={isSoundEnabled}
                                            onChange={(e) => setIsSoundEnabled(e.target.checked)}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                    </label>
                                </FormGroup>
                            </SettingsCard>
                        </div>
                       
                        <div className="space-y-8">
                             <SettingsCard title={t.settingsBranding} subtitle={t.settingsHeroDescription}>
                                <FormGroup label={t.logo} helperText={t.settingsLogoDescription}>
                                    <div className="flex items-center gap-4">
                                        <img src={localInfo.logo} alt="Logo preview" className="w-20 h-20 object-contain rounded-full bg-slate-100 dark:bg-slate-700/50 p-1 border-2 border-white dark:border-slate-600 shadow-md" />
                                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} className={fileInputClasses} />
                                    </div>
                                </FormGroup>
                                <hr className="border-slate-200 dark:border-slate-700"/>
                                <FormGroup label={t.heroImage} helperText={t.settingsHeroDescription}>
                                    <div className="flex items-center gap-4">
                                        {localInfo.heroImage && <img src={localInfo.heroImage} alt="Hero preview" className="w-28 h-20 object-cover rounded-lg bg-slate-100 dark:bg-slate-700 p-1 border-2 border-white dark:border-slate-600 shadow-md" />}
                                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'heroImage')} className={fileInputClasses} />
                                    </div>
                                </FormGroup>
                                <hr className="border-slate-200 dark:border-slate-700"/>
                                <div className="grid grid-cols-1 gap-4">
                                    <FormGroup label={t.heroTitleEn}>
                                        <input type="text" name="heroTitle.en" value={localInfo.heroTitle?.en || ''} onChange={handleInfoChange} className={formInputClasses} />
                                    </FormGroup>
                                    <FormGroup label={t.heroTitleAr}>
                                        <input type="text" name="heroTitle.ar" value={localInfo.heroTitle?.ar || ''} onChange={handleInfoChange} className={formInputClasses} />
                                    </FormGroup>
                                </div>
                                <hr className="border-slate-200 dark:border-slate-700"/>
                                <FormGroup label={t.defaultHomepage} helperText={t.settingsHomepageDescription}>
                                    <div className="flex items-center space-x-6 rtl:space-x-reverse bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="radio" name="homepage" value="menu" checked={localInfo.defaultPage === 'menu'} onChange={handleHomepageChange} className="w-5 h-5 text-primary-600 focus:ring-primary-500" />
                                            <span className='font-medium text-slate-800 dark:text-slate-400'>{t.menuPage}</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="radio" name="homepage" value="social" checked={localInfo.defaultPage === 'social'} onChange={handleHomepageChange} className="w-5 h-5 text-primary-600 focus:ring-primary-500" />
                                            <span className='font-medium text-slate-800 dark:text-slate-400'>{t.socialLinksPage}</span>
                                        </label>
                                    </div>
                                </FormGroup>
                            </SettingsCard>
                        </div>
                    </div>
                )}
                
                {activeTab === 'social' && hasPermission('manage_settings_social') && (
                     <SettingsCard 
                        title={t.socialLinksManagement} 
                        subtitle="Manage your social media and contact links."
                        actions={
                             <button onClick={() => setEditingLink('new')} className={btnPrimarySmClasses}>
                                <PlusIcon className="w-5 h-5" />
                                {t.addNewLink}
                            </button>
                        }
                    >
                         <ul className="divide-y divide-gray-200 dark:divide-gray-700 -m-4 sm:-m-6">
                            {(restaurantInfo.socialLinks || []).length > 0 ? (restaurantInfo.socialLinks || []).map(link => (
                                <li key={link.id} className="p-3 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-50 dark:hover:bg-gray-700/50">
                                    <div className="flex items-center gap-4 flex-grow">
                                        <img src={link.icon} alt={`${link.name} icon`} className="w-8 h-8 object-contain flex-shrink-0" />
                                        <div className="flex-grow">
                                            <div className="font-medium text-slate-800 dark:text-slate-200">{link.name}</div>
                                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 dark:text-primary-400 hover:underline truncate max-w-[200px] sm:max-w-xs block">{link.url}</a>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                        <label className="relative inline-flex items-center cursor-pointer" title={t.visibleOnPage}>
                                            <input type="checkbox" checked={link.isVisible} onChange={() => handleToggleVisibility(link.id, 'social')} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                        <button onClick={() => setEditingLink(link)} className={btnIconSecondaryClasses} title={t.editLink}><PencilIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleDeleteLink(link.id)} className={btnIconDangerClasses} title={t.cancel}><TrashIcon className="w-5 h-5" /></button>
                                    </div>
                                </li>
                            )) : (
                                <p className="p-6 text-center text-slate-500">No social links added yet.</p>
                            )}
                        </ul>
                    </SettingsCard>
                )}

                 {activeTab === 'statuses' && hasPermission('manage_settings_statuses') && (
                     <SettingsCard 
                        title={t.orderStatusManagement} 
                        subtitle="Define the stages for your order workflow."
                        actions={
                            <button onClick={() => setEditingOrderStatus('new')} className={btnPrimarySmClasses}>
                                <PlusIcon className="w-5 h-5" />
                                {t.addNewStatus}
                            </button>
                        }
                     >
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700 -m-4 sm:-m-6">
                            {(localInfo.orderStatusColumns || []).map(status => (
                                <li key={status.id} className="p-3 flex justify-between items-center gap-4 hover:bg-slate-50 dark:hover:bg-gray-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full bg-${status.color}-500 flex-shrink-0`}></div>
                                        <div>
                                            <div className="font-medium text-slate-800 dark:text-slate-200">{status.name[language]}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{status.id}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="relative inline-flex items-center cursor-pointer" title={t.playSoundOnEntry}>
                                            <input
                                                type="checkbox"
                                                checked={!!status.playSound}
                                                onChange={() => handleStatusSoundToggle(status.id)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:bg-green-600 after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                        </label>
                                        <button onClick={() => setEditingOrderStatus(status)} className={btnIconSecondaryClasses} title={t.editStatus}><PencilIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleDeleteStatus(status.id)} className={btnIconDangerClasses} title={t.cancel}><TrashIcon className="w-5 h-5" /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </SettingsCard>
                )}

                {activeTab === 'payments' && hasPermission('manage_settings_payments') && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <SettingsCard
                            title={t.paymentGatewaysIntegration}
                            subtitle={t.paymentGatewaysSubtitle}
                        >
                            <FormGroup label={t.enablePaymobIntegration} helperText={t.enablePaymobHelper}>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={localInfo.isPaymobVisible ?? true}
                                        onChange={(e) => setLocalInfo(prev => prev ? { ...prev, isPaymobVisible: e.target.checked } : null)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </FormGroup>
                        </SettingsCard>
                        <SettingsCard 
                            title={t.onlinePaymentMethods} 
                            subtitle={t.onlineNotesHelper}
                            actions={
                                <button onClick={() => setEditingPaymentMethod('new')} className={btnPrimarySmClasses}>
                                    <PlusIcon className="w-5 h-5" />
                                    {t.addNewPaymentMethod}
                                </button>
                            }
                        >
                             <ul className="divide-y divide-gray-200 dark:divide-gray-700 -m-4 sm:-m-6">
                                {(restaurantInfo.onlinePaymentMethods || []).length > 0 ? (restaurantInfo.onlinePaymentMethods || []).map(method => (
                                    <li key={method.id} className="p-3 flex justify-between items-center gap-4 hover:bg-slate-50 dark:hover:bg-gray-700/50">
                                        <div className="flex items-center gap-4 flex-grow">
                                            <img src={method.icon} alt={`${method.name[language]} icon`} className="w-8 h-8 object-contain flex-shrink-0" />
                                            <div className="flex-grow">
                                                <div className="font-medium text-slate-800 dark:text-slate-200">{method.name[language]}</div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-xs block">{method.details}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="relative inline-flex items-center cursor-pointer" title={t.visibleOnPage}>
                                                <input type="checkbox" checked={method.isVisible} onChange={() => handleToggleVisibility(method.id, 'payment')} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                            </label>
                                            <button onClick={() => setEditingPaymentMethod(method)} className={btnIconSecondaryClasses} title={t.editPaymentMethod}><PencilIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleDeletePaymentMethod(method.id)} className={btnIconDangerClasses} title={t.cancel}><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </li>
                                )) : (
                                    <p className="p-6 text-center text-slate-500">{t.noInvoicesFound}</p>
                                )}
                            </ul>
                        </SettingsCard>
                        <div className="xl:col-span-2">
                            <SettingsCard title={t.paymentInstructionsSettings} subtitle="Provide specific instructions for different payment methods.">
                                <FormGroup label={t.codNotes} helperText={t.codNotesHelper}>
                                    <textarea name="codNotes.en" value={localInfo.codNotes?.en || ''} onChange={handleInfoChange} placeholder="English Notes" rows={3} className={formInputClasses + ' mb-2'}></textarea>
                                    <textarea name="codNotes.ar" value={localInfo.codNotes?.ar || ''} onChange={handleInfoChange} placeholder="Arabic Notes" rows={3} className={formInputClasses}></textarea>
                                </FormGroup>
                                <hr className="border-slate-200 dark:border-slate-700"/>
                                <FormGroup label={t.onlinePaymentNotes} helperText={t.onlineNotesHelper}>
                                    <textarea name="onlinePaymentNotes.en" value={localInfo.onlinePaymentNotes?.en || ''} onChange={handleInfoChange} placeholder="English Notes" rows={3} className={formInputClasses + ' mb-2'}></textarea>
                                    <textarea name="onlinePaymentNotes.ar" value={localInfo.onlinePaymentNotes?.ar || ''} onChange={handleInfoChange} placeholder="Arabic Notes" rows={3} className={formInputClasses}></textarea>
                                </FormGroup>
                            </SettingsCard>
                        </div>
                    </div>
                )}
                 {activeTab === 'activation' && hasPermission('manage_settings_activation') && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="xl:col-span-3">
                             <SettingsCard title={t.systemActivation} subtitle={t.systemActivationSubtitle}>
                                <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-900/50">
                                    <h4 className="font-semibold text-slate-500 dark:text-slate-400">{t.activationStatus}</h4>
                                    {localInfo.activationEndDate && !isExpired ? (
                                        <>
                                            <p className="text-lg font-bold text-green-600 dark:text-green-400">{t.activeUntil} {formatDateTime(localInfo.activationEndDate)}</p>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
                                                {t.remainingFor}{' '}
                                                <span className="font-bold text-primary-600 dark:text-primary-400">
                                                    {days} {days === 1 ? t.countdownDay : t.countdownDays}, {hours} {hours === 1 ? t.countdownHour : t.countdownHours}
                                                </span>
                                            </p>
                                        </>
                                    ) : !localInfo.activationEndDate ? (
                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{t.activeIndefinitely}</p>
                                    ) : (
                                        <p className="text-lg font-bold text-red-600 dark:text-red-400">{t.inactive}</p>
                                    )}
                                </div>
                                <FormGroup label={t.extendActivation}>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { label: t.add1Day, amount: 1, unit: 'day'}, { label: t.add3Days, amount: 3, unit: 'day'},
                                            { label: t.add1Week, amount: 7, unit: 'day'}, { label: t.add1Month, amount: 1, unit: 'month'},
                                            { label: t.add3Months, amount: 3, unit: 'month'}, { label: t.add6Months, amount: 6, unit: 'month'},
                                            { label: t.add1Year, amount: 1, unit: 'year'},
                                        ].map(ext => (
                                            <button key={`${ext.amount}-${ext.unit}`} type="button" onClick={() => handleExtendActivation(ext.amount, ext.unit as any)} className="px-3 py-1.5 text-sm font-semibold rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:hover:bg-blue-900">
                                                {ext.label}
                                            </button>
                                        ))}
                                    </div>
                                </FormGroup>
                                <FormGroup label={t.setCustomEndDate}>
                                    <input 
                                        type="datetime-local"
                                        value={formatDateForInput(localInfo.activationEndDate)}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setLocalInfo(prev => prev ? { ...prev, activationEndDate: value ? new Date(value).toISOString() : null } : null);
                                        }}
                                        className={formInputClasses}
                                    />
                                </FormGroup>
                                    <FormGroup label={t.deactivationMessage}>
                                    <textarea name="deactivationMessage.en" value={localInfo.deactivationMessage?.en || ''} onChange={handleInfoChange} placeholder="English Deactivation Message" rows={2} className={formInputClasses + ' mb-2'}></textarea>
                                    <textarea name="deactivationMessage.ar" value={localInfo.deactivationMessage?.ar || ''} onChange={handleInfoChange} placeholder="Arabic Deactivation Message" rows={2} className={formInputClasses}></textarea>
                                </FormGroup>
                                <button type="button" onClick={handleDeactivateNow} className="w-full text-center px-4 py-2 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200 dark:bg-red-900/50 dark:text-red-200 dark:hover:bg-red-900">
                                    {t.deactivateNow}
                                </button>
                            </SettingsCard>
                        </div>
                    </div>
                )}
            </div>
            
            {editingPaymentMethod && (
                <OnlinePaymentMethodEditModal
                    method={editingPaymentMethod === 'new' ? null : editingPaymentMethod}
                    onClose={() => setEditingPaymentMethod(null)}
                    onSave={handleSavePaymentMethod}
                />
            )}

            {editingLink && (
                <SocialLinkEditModal
                    link={editingLink === 'new' ? null : editingLink}
                    onClose={() => setEditingLink(null)}
                    onSave={handleSaveLink}
                />
            )}
            
            {editingOrderStatus && (
                <OrderStatusEditModal
                    statusColumn={editingOrderStatus === 'new' ? null : editingOrderStatus}
                    onClose={() => setEditingOrderStatus(null)}
                    onSave={handleSaveStatus}
                    existingIds={(restaurantInfo.orderStatusColumns || []).map(c => c.id)}
                />
            )}

            {isDirty && (
                <div className={`fixed bottom-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-700 w-full md:w-[calc(100%-16rem)] ${language === 'ar' ? 'md:right-0' : 'md:left-64'}`}>
                    <div className="container mx-auto max-w-full px-4 sm:px-6 lg:px-8 py-3">
                        <div className="flex justify-end items-center gap-4">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 me-auto">{language === 'ar' ? 'لديك تغييرات غير محفوظة.' : 'You have unsaved changes.'}</p>
                            <button
                                onClick={() => setLocalInfo(restaurantInfo)}
                                className="px-5 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold transition-colors"
                            >
                                {language === 'ar' ? 'تجاهل' : 'Discard'}
                            </button>
                            <button
                                onClick={handleSaveChanges}
                                className="px-5 py-2.5 rounded-lg bg-primary-500 text-white hover:bg-primary-600 font-semibold transition-colors shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                            >
                                {t.saveChanges}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
