import React from 'react';
import { useUI } from '../../../contexts/UIContext';

interface ReportHeaderProps {
  title: string;
  dateRange: string;
  setDateRange: (range: string) => void;
  customStartDate?: string;
  setCustomStartDate?: (date: string) => void;
  customEndDate?: string;
  setCustomEndDate?: (date: string) => void;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ 
    title, 
    dateRange, 
    setDateRange, 
    customStartDate, 
    setCustomStartDate,
    customEndDate,
    setCustomEndDate
}) => {
  const { t } = useUI();
  
  const dateFilters = [
      { id: 'today', label: t.today },
      { id: 'yesterday', label: t.yesterday },
      { id: 'last7days', label: t.last7days },
      { id: 'thisMonth', label: t.thisMonth },
      { id: 'custom', label: t.customRange },
  ];

  const getButtonClasses = (filterId: string) => 
    `px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
        dateRange === filterId 
        ? 'bg-primary-600 text-white shadow' 
        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
    }`;

  const handleCustomDateChange = (setter: (date: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      setDateRange('custom');
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 flex-wrap">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 shrink-0">{title}</h1>
      <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
         {dateFilters.map(filter => (
            <button
                key={filter.id}
                onClick={() => setDateRange(filter.id)}
                className={getButtonClasses(filter.id)}
            >
                {filter.label}
            </button>
         ))}
        {dateRange === 'custom' && setCustomStartDate && setCustomEndDate && (
            <>
                <input type="date" value={customStartDate} onChange={handleCustomDateChange(setCustomStartDate)} className="p-1.5 h-9 rounded-lg border-slate-300 shadow-sm sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:[color-scheme:dark]" />
                <input type="date" value={customEndDate} onChange={handleCustomDateChange(setCustomEndDate)} className="p-1.5 h-9 rounded-lg border-slate-300 shadow-sm sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:[color-scheme:dark]" />
            </>
        )}
      </div>
    </div>
  );
};