
import React from 'react';
import ReactDOM from 'react-dom';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';

interface LoadingOverlayProps {
  isVisible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible }) => {
  const { restaurantInfo } = useData();
  const { language } = useUI();
  const portalRoot = document.getElementById('portal-root');

  if (!portalRoot) return null;

  return ReactDOM.createPortal(
    <div 
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-opacity ${isVisible ? 'duration-0 opacity-100 pointer-events-auto' : 'duration-500 ease-in-out opacity-0 pointer-events-none'}`}
        role="status"
        aria-live="polite"
    >
      <div className="relative flex flex-col items-center gap-8 transform transition-transform duration-500 hover:scale-105">
        <div className="relative">
            {/* Outer Glow/Ring Animation */}
            <div className="absolute -inset-6 rounded-full border-2 border-dashed border-primary-500/30 dark:border-primary-400/20 animate-[spin_8s_linear_infinite]"></div>
            <div className="absolute -inset-1 rounded-full border-t-2 border-r-2 border-primary-500 dark:border-primary-400 animate-spin"></div>
            
            {/* Logo Container */}
            <div className="relative z-10 w-28 h-28 bg-white dark:bg-slate-900 rounded-full shadow-2xl flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800">
                {restaurantInfo?.logo ? (
                    <img 
                        src={restaurantInfo.logo} 
                        alt="Loading..." 
                        className="w-full h-full object-cover animate-pulse"
                    />
                ) : (
                    <div className="w-12 h-12 bg-primary-500 rounded-full animate-bounce"></div>
                )}
            </div>
        </div>

        {/* Branding Text */}
        <div className="text-center space-y-2 animate-fade-in-up">
            <h2 className="text-xl sm:text-2xl font-black tracking-widest text-slate-800 dark:text-slate-100 uppercase">
                {restaurantInfo?.name?.[language] || 'Loading'}
            </h2>
            <div className="flex justify-center gap-1">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
            </div>
        </div>
      </div>
    </div>,
    portalRoot
  );
};
