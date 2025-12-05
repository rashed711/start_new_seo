
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Language, Category, Tag, LocalizedString } from '../types';
// @FIX: Replaced non-existent `useTranslations` hook with direct access to the `translations` object.
import { translations } from '../i18n/translations';
import { SearchIcon, FilterIcon, ChevronRightIcon } from './icons/Icons';
import { formatNumber } from '../utils/helpers';

interface SearchAndFilterProps {
  language: Language;
  categories: Category[];
  tags: Tag[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: number | null;
  setSelectedCategory: (id: number | null) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  language,
  categories,
  tags,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedTags,
  setSelectedTags,
}) => {
  // @FIX: Replaced non-existent `useTranslations` hook with direct access to the `translations` object.
  const t = translations[language];
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTagChange = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(t => t !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(newTags);
  };
  
  // This helper will check if a category or any of its children are selected
  const isCategoryOrChildSelected = useCallback((category: Category): boolean => {
      if (selectedCategory === null) return false;
      if (selectedCategory === category.id) return true;
      if (!category.children) return false;

      const childIds = category.children.map(c => c.id);
      return childIds.includes(selectedCategory);
  }, [selectedCategory]);

  return (
    <div id="menu" className="-mb-56 p-4 sm:p-6 bg-white dark:bg-slate-900/50 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-800/50 space-y-4">
      {/* Top row: Search and Filter Toggle */}
      <div className="flex flex-row gap-2 items-center">
        <div className="relative w-full flex-grow">
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 ps-8 text-sm border-2 border-slate-200 dark:border-slate-700 rounded-full bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
          <div className="absolute top-1/2 -translate-y-1/2 start-2.5 text-slate-400 dark:text-slate-500">
            <SearchIcon className="w-4 h-4" />
          </div>
        </div>
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 border-2 rounded-full font-bold text-xs sm:text-sm transition-colors ${isFilterOpen ? 'bg-primary-100 dark:bg-primary-900/50 border-primary-500 text-primary-700 dark:text-primary-300' : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-primary-400 dark:hover:border-primary-500'}`}
        >
          <FilterIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">{t.filterByTags}</span>
          <span className="sm:hidden">{t.filter}</span>
          {selectedTags.length > 0 && (
            <span className="bg-primary-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {formatNumber(selectedTags.length)}
            </span>
          )}
        </button>
      </div>

      {/* Collapsible Filter Panel for Tags */}
       <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterOpen ? 'max-h-40 opacity-100 pt-4 border-t border-slate-200 dark:border-slate-700' : 'max-h-0 opacity-0'}`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          {tags.map(tag => (
            <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTags.includes(tag.id)}
                onChange={() => handleTagChange(tag.id)}
                className="sr-only peer"
              />
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 peer-checked:bg-primary-100 dark:peer-checked:bg-primary-900/50 peer-checked:border-primary-500 peer-checked:text-primary-700 dark:peer-checked:text-primary-300 transition-colors">
                {tag.name[language]}
              </span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Categories */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-2 overflow-x-auto scrollbar-hide py-2 pb-56 pointer-events-none">
            <button
                onClick={() => setSelectedCategory(null)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap pointer-events-auto ${selectedCategory === null ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
            >
                {t.allCategories}
            </button>
            {categories.map(category => {
                const hasChildren = category.children && category.children.length > 0;
                const isActive = isCategoryOrChildSelected(category);

                if (hasChildren) {
                    return (
                        <div key={category.id} className="relative pointer-events-auto" ref={openDropdown === category.id ? dropdownRef : null}>
                            <button
                                onClick={() => {
                                    setOpenDropdown(openDropdown === category.id ? null : category.id);
                                }}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${isActive ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                            >
                                <span>{category.name[language]}</span>
                                <ChevronRightIcon className={`w-4 h-4 transition-transform ${language === 'ar' ? 'transform -scale-x-100' : ''} ${openDropdown === category.id ? 'rotate-90' : ''}`} />
                            </button>
                            {openDropdown === category.id && (
                                <div className="absolute top-full mt-2 z-[60] min-w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 animate-fade-in py-1 max-h-60 overflow-y-auto">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedCategory(category.id);
                                            setOpenDropdown(null);
                                        }}
                                        className={`block w-full text-start px-4 py-2 text-sm transition-colors ${selectedCategory === category.id && (!category.children || !category.children.some(c => c.id === selectedCategory)) ? 'font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/40' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                    >
                                        {t.all} {category.name[language]}
                                    </button>
                                    {category.children!.map(child => (
                                        <button
                                            key={child.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedCategory(child.id);
                                                setOpenDropdown(null);
                                            }}
                                            className={`block w-full text-start px-4 py-2 text-sm transition-colors ${selectedCategory === child.id ? 'font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/40' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                        >
                                            {child.name[language]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                }

                // Render simple button for categories without children
                return (
                    <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap pointer-events-auto ${selectedCategory === category.id ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                    >
                        {category.name[language]}
                    </button>
                );
            })}
        </div>
      </div>
    </div>
  );
};