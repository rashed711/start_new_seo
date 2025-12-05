import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { CloseIcon } from './icons/Icons';

interface ModalProps {
    onClose: () => void;
    children: React.ReactNode;
    title: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({ onClose, children, title, size = 'md' }) => {
    const portalRoot = document.getElementById('portal-root');

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'auto';
        };
    }, [onClose]);

    if (!portalRoot) return null;

    const sizeClasses: Record<string, string> = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
    };

    return ReactDOM.createPortal(
         <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" 
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                className={`bg-white dark:bg-slate-800 rounded-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col animate-fade-in-up shadow-2xl`} 
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 shrink-0">
                    <h2 id="modal-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label="Close">
                        <CloseIcon className="w-6 h-6 text-slate-500 dark:text-slate-400"/>
                    </button>
                </div>
                <div className="overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>,
        portalRoot
    );
};