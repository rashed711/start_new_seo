import React, { useState, useEffect } from 'react';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../Modal';
import { GovernorateSelector } from '../checkout/GovernorateSelector';

interface CompleteProfileModalProps {
    onClose: () => void;
}

export const CompleteProfileModal: React.FC = () => {
    const { t, isProcessing, language } = useUI();
    const { completeProfile, newUserFirebaseData, logout, currentUser } = useAuth();
    
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [governorate, setGovernorate] = useState('');
    const [addressDetails, setAddressDetails] = useState('');

    useEffect(() => {
        if (newUserFirebaseData?.name) {
            setName(newUserFirebaseData.name);
        } else if (currentUser?.name) { // Pre-fill from current user for Google Sign-In flow
            setName(currentUser.name);
        }
        
        if (newUserFirebaseData?.phoneNumber) {
            setMobile(newUserFirebaseData.phoneNumber);
        } else if (currentUser?.mobile) {
            setMobile(currentUser.mobile);
        }
    }, [newUserFirebaseData, currentUser]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && mobile.trim() && governorate.trim() && addressDetails.trim()) {
            // FIX: Pass all required properties to the completeProfile function.
            completeProfile({ name: name.trim(), mobile: mobile.trim(), governorate: governorate.trim(), address_details: addressDetails.trim() });
        }
    };

    return (
        <Modal 
            title={t.language === 'ar' ? 'أكمل ملفك الشخصي' : 'Complete Your Profile'} 
            onClose={logout}
            size="sm"
        >
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                 <p className="text-center text-sm text-slate-600 dark:text-slate-300">
                    {t.language === 'ar' ? 'مرحباً بك! نحتاج بعض المعلومات الإضافية.' : 'Welcome! We just need a little more info.'}
                </p>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">{t.fullName}</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 text-base border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        required
                        autoFocus
                    />
                </div>

                <div>
                    <label htmlFor="mobile" className="block text-sm font-medium mb-1">{t.mobileNumber}</label>
                    <input
                        id="mobile"
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                         className="w-full p-3 text-base border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="e.g. 01012345678"
                        required
                    />
                    <p className="text-xs text-slate-500 mt-1">{t.language === 'ar' ? 'نحتاج رقم هاتفك لإتمام الطلبات.' : 'We need your phone number for orders.'}</p>
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
                        className="w-full p-3 text-base border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder={t.enterAddressPrompt}
                        required 
                    />
                </div>

                <button
                    type="submit"
                    disabled={isProcessing || !name.trim() || !mobile.trim() || !governorate.trim() || !addressDetails.trim()}
                    className="w-full mt-4 bg-green-500 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    {isProcessing 
                        ? (t.language === 'ar' ? 'جار الحفظ...' : 'Saving...') 
                        : (t.language === 'ar' ? 'حفظ ومتابعة' : 'Save & Continue')}
                </button>
                 <button
                    type="button"
                    onClick={logout}
                    disabled={isProcessing}
                    className="w-full text-center text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 py-2 rounded-lg transition-colors"
                >
                    {t.language === 'ar' ? 'إلغاء وتسجيل الخروج' : 'Cancel & Logout'}
                </button>
            </form>
        </Modal>
    );
};