import React, { useState, useEffect } from 'react';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { UserCircleIcon, DevicePhoneMobileIcon } from '../icons/Icons';
import { GovernorateSelector } from '../checkout/GovernorateSelector';

export const CompleteProfilePage: React.FC = () => {
    const { t, isProcessing, language } = useUI();
    const { completeProfile, newUserFirebaseData, logout, currentUser } = useAuth();
    
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [governorate, setGovernorate] = useState('');
    const [addressDetails, setAddressDetails] = useState('');

    useEffect(() => {
        // Pre-fill data from Firebase Auth object on first load
        if (newUserFirebaseData?.name) {
            setName(newUserFirebaseData.name);
        } else if (currentUser?.name) { // Also handle case for Google sign-in where user exists but needs mobile
            setName(currentUser.name);
        }
        
        if (newUserFirebaseData?.phoneNumber) {
            setMobile(newUserFirebaseData.phoneNumber);
        } else if (currentUser?.mobile) { // This case shouldn't happen if profile is incomplete, but safe to have.
            setMobile(currentUser.mobile);
        }
    }, [newUserFirebaseData, currentUser]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && mobile.trim() && governorate.trim() && addressDetails.trim()) {
            completeProfile({ 
                name: name.trim(), 
                mobile: mobile.trim(),
                governorate: governorate.trim(),
                address_details: addressDetails.trim()
            });
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                        {language === 'ar' ? 'أكمل ملفك الشخصي' : 'Complete Your Profile'}
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        {language === 'ar' ? 'مرحباً بك! نحتاج بعض المعلومات الإضافية للمتابعة.' : 'Welcome! We just need a little more info to continue.'}
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">{t.fullName}</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                                <UserCircleIcon className="w-5 h-5 text-slate-400" />
                            </div>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 ps-10 text-base border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="mobile" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">{t.mobileNumber}</label>
                         <div className="relative">
                            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                                <DevicePhoneMobileIcon className="w-5 h-5 text-slate-400" />
                            </div>
                            <input
                                id="mobile"
                                type="tel"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                className="w-full p-3 ps-10 text-base border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                placeholder="e.g. 01012345678"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.governorate}</label>
                        <GovernorateSelector
                            selectedGovernorate={governorate}
                            onSelectGovernorate={setGovernorate}
                            language={language}
                        />
                    </div>

                     <div>
                        <label htmlFor="address_details" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.addressDetailsLabel}</label>
                        <textarea 
                            id="address_details"
                            value={addressDetails} 
                            onChange={e => setAddressDetails(e.target.value)} 
                            rows={3} 
                            className="w-full p-3 text-base border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            placeholder={t.enterAddressPrompt}
                            required 
                        />
                    </div>

                    <div className="pt-2 space-y-3">
                        <button
                            type="submit"
                            disabled={isProcessing || !name.trim() || !mobile.trim() || !governorate.trim() || !addressDetails.trim()}
                            className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            {isProcessing 
                                ? (language === 'ar' ? 'جار الحفظ...' : 'Saving...') 
                                : (language === 'ar' ? 'حفظ ومتابعة' : 'Save & Continue')}
                        </button>
                        <button
                            type="button"
                            onClick={logout}
                            disabled={isProcessing}
                            className="w-full text-center text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 py-2 rounded-lg transition-colors"
                        >
                            {language === 'ar' ? 'إلغاء وتسجيل الخروج' : 'Cancel & Logout'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};