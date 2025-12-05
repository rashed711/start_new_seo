import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Order } from '../../types';
import { PencilIcon, CameraIcon, KeyIcon, LogoutIcon, CheckIcon, CloseIcon, DevicePhoneMobileIcon, EnvelopeIcon, UserCircleIcon, ClipboardListIcon, ClockIcon, ShieldCheckIcon, InformationCircleIcon, TruckIcon, HomeIcon } from '../icons/Icons';
import { FeedbackModal } from './FeedbackModal';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useOrders } from '../../contexts/OrderContext';
import { Header } from '../Header';
import { optimizeImage } from '../../utils/imageOptimizer';
import { ReceiptModal } from '../ReceiptModal';
import { generateReceiptImage } from '../../utils/helpers';
import { ActiveOrderCard } from './ActiveOrderCard';
import { PastOrderCard } from './PastOrderCard';
import { GovernorateSelector } from '../checkout/GovernorateSelector';


type ProfileTab = 'info' | 'active' | 'history' | 'security';

export const ProfilePage: React.FC = () => {
    const { language, t, setIsChangePasswordModalOpen, setIsProcessing, showToast } = useUI();
    const { currentUser, logout, updateUserProfile } = useAuth();
    const { restaurantInfo } = useData();
    const { orders, updateOrder } = useOrders();
    
    const [activeTab, setActiveTab] = useState<ProfileTab>('active');
    const [feedbackOrder, setFeedbackOrder] = useState<Order | null>(null);
    const [receiptImageUrl, setReceiptImageUrl] = useState<string>('');
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    
    // State for inline editing
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(currentUser?.name || '');
    const [isEditingMobile, setIsEditingMobile] = useState(false);
    const [mobile, setMobile] = useState(currentUser?.mobile || '');
    const [isEditingGovernorate, setIsEditingGovernorate] = useState(false);
    const [governorate, setGovernorate] = useState(currentUser?.governorate || '');
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [addressDetails, setAddressDetails] = useState(currentUser?.address_details || '');
    const profilePicInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!currentUser) {
            window.location.hash = '#/login';
        } else {
            setName(currentUser.name);
            setMobile(currentUser.mobile);
            setGovernorate(currentUser.governorate || '');
            setAddressDetails(currentUser.address_details || '');
        }
    }, [currentUser]);

    const handleSaveName = () => {
        if (currentUser && name.trim() && name.trim() !== currentUser.name) {
            updateUserProfile(currentUser.id, { name: name.trim() });
        }
        setIsEditingName(false);
    };
    
    const handleSaveMobile = () => {
        if (currentUser && mobile.trim() && mobile.trim() !== currentUser.mobile) {
            updateUserProfile(currentUser.id, { mobile: mobile.trim() });
        }
        setIsEditingMobile(false);
    };

    const handleSaveGovernorate = () => {
        if (currentUser && governorate.trim() !== (currentUser.governorate || '')) {
            updateUserProfile(currentUser.id, { governorate: governorate.trim() });
        }
        setIsEditingGovernorate(false);
    };
    
    const handleSaveAddressDetails = () => {
        if (currentUser && addressDetails.trim() !== (currentUser.address_details || '')) {
            updateUserProfile(currentUser.id, { address_details: addressDetails.trim() });
        }
        setIsEditingAddress(false);
    };

    const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && currentUser) {
            setIsProcessing(true);
            try {
                const optimizedFile = await optimizeImage(file, 256, 256, 0.9);
                const reader = new FileReader();
                reader.onloadend = () => {
                    updateUserProfile(currentUser.id, { profilePicture: reader.result as string });
                };
                reader.readAsDataURL(optimizedFile);
            } catch (error) {
                console.error("Profile picture optimization failed:", error);
                showToast("Failed to process image. Please try another one.");
                setIsProcessing(false);
            }
        }
    };

    const userOrders = useMemo(() => {
        if (!currentUser) return [];
        return orders.filter(o => o.customer.userId === currentUser.id);
    }, [orders, currentUser]);

    const { activeOrders, pastOrders } = useMemo(() => {
        const active: Order[] = [];
        const past: Order[] = [];
        const terminalStatuses = ['completed', 'cancelled', 'refused'];
        const sortedOrders = [...userOrders].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        for (const order of sortedOrders) {
            if (terminalStatuses.includes(order.status)) {
                past.push(order);
            } else {
                active.push(order);
            }
        }
        return { activeOrders: active, pastOrders: past };
    }, [userOrders]);

    const handleSaveFeedback = (feedback: { rating: number; comment: string }) => {
        if (feedbackOrder) {
            updateOrder(feedbackOrder.id, { customerFeedback: feedback });
            setFeedbackOrder(null);
        }
    };

    const handleShareInvoice = async (order: Order) => {
        if (!restaurantInfo) return;
        setIsProcessing(true);
        try {
            const imageUrl = await generateReceiptImage(order, restaurantInfo, t, language);
            setReceiptImageUrl(imageUrl);
            setIsReceiptModalOpen(true);
        } catch (error) {
            console.error("Error generating receipt for sharing:", error);
            showToast("Failed to generate receipt image.");
        } finally {
            setIsProcessing(false);
        }
    };
    
    if (!currentUser || !restaurantInfo) {
        return null;
    }

    const isGoogleUser = !!currentUser.google_id;

    const tabs = [
        { id: 'active', label: t.activeOrders, icon: ClipboardListIcon },
        { id: 'history', label: t.orderHistory, icon: ClockIcon },
        { id: 'info', label: t.personalInformation, icon: UserCircleIcon },
        { id: 'security', label: t.security, icon: ShieldCheckIcon },
    ];
    
    const renderEditableField = (
        label: string, 
        Icon: React.FC<any>, 
        value: string, 
        isEditing: boolean, 
        setValue: (val: string) => void, 
        handleSave: () => void, 
        handleCancel: () => void,
        inputType: 'text' | 'tel' = 'text'
    ) => (
        <div className="flex items-center justify-between p-4 transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-4">
                <Icon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                <div className="text-sm">
                    <p className="font-medium text-slate-500 dark:text-slate-400">{label}</p>
                    {!isEditing ? (
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-base">{value}</p>
                    ) : (
                        <input 
                            type={inputType}
                            value={value} 
                            onChange={(e) => setValue(e.target.value)} 
                            className="text-base font-semibold bg-transparent border-b-2 border-primary-500 focus:outline-none dark:text-slate-100" 
                            autoFocus 
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
                        />
                    )}
                </div>
            </div>
            {!isEditing ? (
                <button onClick={() => { if(label === t.name) setIsEditingName(true); else setIsEditingMobile(true); }} className="p-2 text-slate-400 hover:text-primary-600 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/50 transition-colors">
                    <PencilIcon className="w-5 h-5" />
                </button>
            ) : (
                <div className="flex items-center gap-2">
                    <button onClick={handleSave} className="p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full"><CheckIcon className="w-5 h-5" /></button>
                    <button onClick={handleCancel} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><CloseIcon className="w-5 h-5" /></button>
                </div>
            )}
        </div>
    );
    
    return (
        <>
            <Header onCartClick={() => window.location.hash = '#/'} />
            <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
                <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12">
                    
                    {/* Profile Header */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 mb-10">
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
                            <img src={currentUser.profilePicture} alt={t.profilePicture} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg"/>
                            <input type="file" ref={profilePicInputRef} onChange={handlePictureChange} accept="image/*" className="sr-only"/>
                            <button onClick={() => profilePicInputRef.current?.click()} className="absolute bottom-0 end-0 bg-primary-500 text-white rounded-full p-2 hover:bg-primary-600 transition-transform transform hover:scale-110 shadow-md" aria-label={t.changeProfilePicture} title={t.changeProfilePicture}><CameraIcon className="w-5 h-5"/></button>
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-100 text-center sm:text-start">{currentUser.name}</h1>
                            <span className="mt-2 inline-block bg-primary-100 text-primary-800 text-sm font-semibold px-4 py-1 rounded-full dark:bg-primary-900/50 dark:text-primary-300">{t[currentUser.role as keyof typeof t]}</span>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="mb-8 border-b border-slate-300 dark:border-slate-700">
                        <nav className="-mb-px flex space-x-6 rtl:space-x-reverse overflow-x-auto" aria-label="Tabs">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as ProfileTab)}
                                    className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-base transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="animate-fade-in">
                        {activeTab === 'info' && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
                                {renderEditableField(t.name, PencilIcon, name, isEditingName, setName, handleSaveName, () => { setIsEditingName(false); setName(currentUser.name); })}
                                {renderEditableField(t.mobileNumber, DevicePhoneMobileIcon, mobile, isEditingMobile, setMobile, handleSaveMobile, () => { setIsEditingMobile(false); setMobile(currentUser.mobile); }, 'tel')}
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-4">
                                        <EnvelopeIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                                        <div className="text-sm">
                                            <p className="font-medium text-slate-500 dark:text-slate-400">{t.email}</p>
                                            <p className="font-semibold text-slate-800 dark:text-slate-100 text-base">{currentUser.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">{language === 'ar' ? 'للقراءة فقط' : 'Read-only'}</span>
                                </div>
                                 <div className="flex items-center justify-between p-4 transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-700/30 rounded-lg">
                                    <div className="flex items-center gap-4 w-full">
                                        <TruckIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                                        <div className="text-sm flex-grow">
                                            <p className="font-medium text-slate-500 dark:text-slate-400">{t.governorate}</p>
                                            {!isEditingGovernorate ? (
                                                <p className="font-semibold text-slate-800 dark:text-slate-100 text-base">{governorate || t.selectGovernorate}</p>
                                            ) : (
                                                <GovernorateSelector
                                                    selectedGovernorate={governorate}
                                                    onSelectGovernorate={setGovernorate}
                                                    language={language}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    {!isEditingGovernorate ? (
                                        <button onClick={() => setIsEditingGovernorate(true)} className="p-2 text-slate-400 hover:text-primary-600 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/50 transition-colors">
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button onClick={handleSaveGovernorate} className="p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full"><CheckIcon className="w-5 h-5" /></button>
                                            <button onClick={() => { setIsEditingGovernorate(false); setGovernorate(currentUser.governorate || ''); }} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><CloseIcon className="w-5 h-5" /></button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between p-4 transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-700/30 rounded-lg">
                                    <div className="flex items-center gap-4 w-full">
                                        <HomeIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                                        <div className="text-sm flex-grow">
                                            <p className="font-medium text-slate-500 dark:text-slate-400">{t.addressDetailsLabel}</p>
                                            {!isEditingAddress ? (
                                                <p className="font-semibold text-slate-800 dark:text-slate-100 text-base whitespace-pre-wrap">{addressDetails || t.enterAddressPrompt}</p>
                                            ) : (
                                                <textarea
                                                    value={addressDetails}
                                                    onChange={(e) => setAddressDetails(e.target.value)}
                                                    className="w-full mt-1 text-base font-semibold bg-slate-50 border-2 border-slate-200 focus:outline-none dark:text-slate-100 rounded-md dark:bg-slate-700 p-2 focus:border-primary-500 focus:ring-primary-500"
                                                    autoFocus
                                                    rows={3}
                                                    onKeyDown={(e) => { if (e.key === 'Escape') { setIsEditingAddress(false); setAddressDetails(currentUser.address_details || ''); } }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    {!isEditingAddress ? (
                                        <button onClick={() => setIsEditingAddress(true)} className="p-2 text-slate-400 hover:text-primary-600 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/50 transition-colors">
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button onClick={handleSaveAddressDetails} className="p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full"><CheckIcon className="w-5 h-5" /></button>
                                            <button onClick={() => { setIsEditingAddress(false); setAddressDetails(currentUser.address_details || ''); }} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><CloseIcon className="w-5 h-5" /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'active' && (
                            <div className="space-y-6">
                                {activeOrders.length > 0
                                    ? activeOrders.map(order => <ActiveOrderCard key={order.id} order={order} />)
                                    : <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700"><p className="text-slate-500">{t.language === 'ar' ? 'ليس لديك طلبات نشطة حاليًا.' : 'You have no active orders.'}</p></div>
                                }
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="space-y-6">
                                {pastOrders.length > 0
                                    ? pastOrders.map(order => <PastOrderCard key={order.id} order={order} onLeaveFeedback={setFeedbackOrder} onShareInvoice={handleShareInvoice} />)
                                    : <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700"><p className="text-slate-500">{t.language === 'ar' ? 'ليس لديك طلبات سابقة.' : 'You have no past orders.'}</p></div>
                                }
                            </div>
                        )}

                        {activeTab === 'security' && (
                             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
                                {isGoogleUser ? (
                                    <div className="p-4 flex items-start gap-4 bg-blue-50 dark:bg-blue-900/30 rounded-t-lg">
                                        <InformationCircleIcon className="w-6 h-6 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                                                {language === 'ar' ? 'حسابك مرتبط بجوجل' : 'Your Account is Linked to Google'}
                                            </h4>
                                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                                {language === 'ar' ? 'ليس لديك كلمة مرور خاصة بالموقع. تتم إدارة أمان حسابك عبر جوجل.' : 'You do not have a site-specific password. Your account security is managed through Google.'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-4">
                                            <KeyIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                                            <div className="text-sm">
                                                <p className="font-medium text-slate-500 dark:text-slate-400">{t.password}</p>
                                                <p className="font-semibold text-slate-800 dark:text-slate-100 text-base">••••••••</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setIsChangePasswordModalOpen(true)} className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">{t.change}</button>
                                    </div>
                                )}
                                <div className="p-4">
                                     <button onClick={logout} className="w-full sm:w-auto flex items-center justify-center gap-3 text-start px-4 py-2 rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors">
                                        <LogoutIcon className="w-5 h-5" />
                                        <span className="font-semibold">{t.logout}</span>
                                    </button>
                                </div>
                             </div>
                        )}
                    </div>

                </main>
                {feedbackOrder && <FeedbackModal order={feedbackOrder} onClose={() => setFeedbackOrder(null)} onSave={handleSaveFeedback} />}
                {isReceiptModalOpen && receiptImageUrl && (
                    <ReceiptModal
                        isOpen={isReceiptModalOpen}
                        onClose={() => setIsReceiptModalOpen(false)}
                        receiptImageUrl={receiptImageUrl}
                        isFromCheckout={false}
                    />
                )}
            </div>
        </>
    );
};