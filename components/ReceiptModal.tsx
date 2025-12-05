import React, { useState, useEffect } from 'react';
import { useUI } from '../contexts/UIContext';
import { DownloadIcon } from './icons/Icons';
import { useCart } from '../contexts/CartContext';
import { useData } from '../contexts/DataContext';
import { Modal } from './Modal';
import { imageUrlToBlob } from '../utils/helpers';

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    receiptImageUrl: string;
    isFromCheckout?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, receiptImageUrl, isFromCheckout = false }) => {
    const { language, t } = useUI();
    const { restaurantInfo } = useData();
    const { clearCart } = useCart();
    const [canShare, setCanShare] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        if (navigator.share) {
            setCanShare(true);
        }
    }, []);
    
    if (!isOpen) return null;

    const handleAfterShare = () => {
        if (isFromCheckout) {
            clearCart();
        }
        onClose();
    };

    const handleShare = async () => {
        setIsSharing(true);
        const whatsAppMessage = language === 'ar' ? 'تفضل إيصال طلبي' : 'Here is my order receipt';
        const whatsappUrl = `https://wa.me/${restaurantInfo?.whatsappNumber}?text=${encodeURIComponent(whatsAppMessage)}`;
        
        try {
            const blob = await imageUrlToBlob(receiptImageUrl);
            const file = new File([blob], `receipt-${Date.now()}.png`, { type: 'image/png' });

            if (canShare && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: t.receiptTitle,
                    text: whatsAppMessage,
                });
                handleAfterShare();
            } else {
                window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                handleAfterShare();
            }
        } catch (error) {
            console.error('Error sharing receipt:', error);
            if ((error as DOMException)?.name !== 'AbortError') {
                alert(language === 'ar' ? 'فشلت المشاركة. يرجى محاولة تحميل الإيصال وإرساله يدوياً.' : 'Sharing failed. Please try downloading the receipt and sending it manually.');
                window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            }
        } finally {
            setIsSharing(false);
        }
    };

    const whatsAppMessage = language === 'ar' ? 'تفضل إيصال طلبي' : 'Here is my order receipt';
    const whatsappUrl = `https://wa.me/${restaurantInfo?.whatsappNumber}?text=${encodeURIComponent(whatsAppMessage)}`;
    
    return (
        <Modal title={t.receiptTitle} onClose={onClose} size="md">
            <div className="p-4 sm:p-5 overflow-y-auto">
                <div className="mb-6 border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                    <img src={receiptImageUrl} alt="Order Receipt" className="w-full h-auto" />
                </div>

                {canShare ? (
                    <>
                        <p className="mb-4 text-center font-semibold">{t.shareInstructions}</p>
                        <button
                            onClick={handleShare}
                            disabled={isSharing}
                            className="w-full bg-green-500 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:bg-slate-400"
                        >
                            {isSharing ? '...' : t.shareOnWhatsApp}
                        </button>
                    </>
                ) : (
                    <>
                        <p className="mb-4 text-center font-semibold">{t.receiptInstructions}</p>
                        <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 mb-4 text-sm space-y-2">
                            <p dangerouslySetInnerHTML={{ __html: t.receiptStep1 }} />
                            <p dangerouslySetInnerHTML={{ __html: t.receiptStep2 }} />
                        </div>
                        <div className="space-y-3">
                            <a
                                href={receiptImageUrl}
                                download={`receipt-${Date.now()}.png`}
                                className="w-full bg-blue-500 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <DownloadIcon className="w-6 h-6"/>
                                {t.downloadReceipt}
                            </a>
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={handleAfterShare}
                                className="w-full bg-green-500 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-600 transition-colors block text-center"
                            >
                            {t.openWhatsApp}
                            </a>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};