
import React from 'react';

interface TopProgressBarProps {
    progress: number;
    show: boolean;
}

export const TopProgressBar: React.FC<TopProgressBarProps> = ({ progress, show }) => {
    return (
        <div 
            className={`fixed top-0 left-0 right-0 h-1 z-50 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
            <div 
                className="h-full bg-primary-500 transition-all duration-200 ease-linear shadow-lg shadow-primary-500/50"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    );
};
