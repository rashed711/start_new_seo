import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Language } from '../../types';
import { governorates } from '../../data/governorates';
import { useUI } from '../../contexts/UIContext';
import { ChevronDownIcon, SearchIcon } from '../icons/Icons';

interface GovernorateSelectorProps {
  selectedGovernorate: string;
  onSelectGovernorate: (governorate: string) => void;
  language: Language;
}

export const GovernorateSelector: React.FC<GovernorateSelectorProps> = ({ selectedGovernorate, onSelectGovernorate, language }) => {
    const { t } = useUI();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredGovernorates = useMemo(() => {
        return governorates.filter(gov => 
            gov.name.ar.includes(searchTerm) ||
            gov.name.en.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const handleSelect = (governorateName: string) => {
        onSelectGovernorate(governorateName);
        setSearchTerm('');
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white flex justify-between items-center text-start"
            >
                <span className={selectedGovernorate ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}>
                    {selectedGovernorate || t.selectGovernorate}
                </span>
                <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg border dark:border-slate-700 max-h-60 flex flex-col">
                    <div className="p-2 border-b dark:border-slate-700">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={t.search + '...'}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full p-2 ps-8 text-sm border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                autoFocus
                            />
                            <SearchIcon className="absolute top-1/2 -translate-y-1/2 start-2.5 w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                    <ul className="overflow-y-auto">
                        {filteredGovernorates.map(gov => (
                            <li key={gov.name.en}>
                                <button
                                    type="button"
                                    onClick={() => handleSelect(gov.name[language])}
                                    className="w-full text-start p-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                    {gov.name[language]}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};