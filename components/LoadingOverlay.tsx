import React from 'react';
import ReactDOM from 'react-dom';

interface LoadingOverlayProps {
  isVisible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible }) => {
  const portalRoot = document.getElementById('portal-root');

  if (!isVisible || !portalRoot) return null;

  return ReactDOM.createPortal(
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center animate-fade-in"
        role="status"
        aria-live="polite"
    >
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      <span className="sr-only">Loading...</span>
    </div>,
    portalRoot
  );
};