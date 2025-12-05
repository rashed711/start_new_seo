import React, { useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { CopyIcon, CheckIcon } from './icons/Icons';

export const CopiedButton: React.FC<{ textToCopy: string; children?: React.ReactNode; className?: string }> = ({ textToCopy, children, className }) => {
    const [copied, setCopied] = useState(false);
    const { t } = useUI();
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent parent onClick
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const baseClasses = "flex items-center gap-2 transition-all duration-300";
    const copiedClasses = 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300';
    const defaultClasses = 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200';

    const finalClassName = `${baseClasses} ${copied ? copiedClasses : defaultClasses} ${className || ''}`;

    return (
        <button 
            type="button" 
            onClick={handleClick}
            className={finalClassName}
        >
            {copied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
            {children && <span>{copied ? t.copied : children}</span>}
        </button>
    );
};
