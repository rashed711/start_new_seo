
import React from 'react';
import type { Order } from '../types';
import { useUI } from '../contexts/UIContext';
import { useData } from '../contexts/DataContext';
import { CheckIcon } from './icons/Icons';

interface OrderStatusTrackerProps {
    orderStatus: string;
}

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({ orderStatus }) => {
    const { restaurantInfo } = useData();
    const { language } = useUI();
    
    if (!restaurantInfo) return null;

    if (orderStatus === 'cancelled' || orderStatus === 'refused') {
        return null;
    }

    const orderStages = restaurantInfo.orderStatusColumns.filter(
        s => s.color !== 'slate'
    );
    
    const currentStageIndex = orderStages.findIndex(s => s.id === orderStatus);

    if (currentStageIndex === -1) {
        return null;
    }

    const completedStageId = orderStages.find(s => s.color === 'green')?.id;

    return (
        <div className="flex items-start -mx-2">
            {orderStages.map((stage, index) => {
                const isCurrent = index === currentStageIndex;
                const isCompleted = index < currentStageIndex || (isCurrent && orderStatus === completedStageId);
                
                let circleClasses = 'bg-slate-300 dark:bg-slate-600 border-slate-300 dark:border-slate-600';
                let icon = null;
                let textClasses = 'text-slate-600 dark:text-slate-400';

                if (isCompleted) {
                    circleClasses = 'bg-green-500 border-green-500';
                    icon = <CheckIcon className="w-6 h-6 text-white" strokeWidth={3} />;
                } else if (isCurrent) {
                    circleClasses = 'bg-blue-500 border-blue-500 animate-pulse';
                    textClasses = 'text-blue-600 dark:text-blue-300';
                }
                
                const isLineCompleted = index < currentStageIndex;

                return (
                    <React.Fragment key={stage.id}>
                        <div className="flex flex-col items-center text-center px-2 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${circleClasses}`}>
                                {icon}
                            </div>
                            <p className={`mt-2 text-xs font-semibold leading-tight ${textClasses}`}>{stage.name[language]}</p>
                        </div>
                        {index < orderStages.length - 1 && (
                            <div className={`flex-1 h-1.5 mt-4 rounded-full transition-colors duration-500 ${isLineCompleted ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};