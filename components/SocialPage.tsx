import React from 'react';
import { ChevronRightIcon } from './icons/Icons';
import { useUI } from '../contexts/UIContext';
import { useData } from '../contexts/DataContext';

export const SocialPage: React.FC = () => {
    const { t, language } = useUI();
    const { restaurantInfo } = useData();

    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        window.location.hash = path;
    };

    if (!restaurantInfo) return null;

    const visibleLinks = restaurantInfo.socialLinks.filter(link => link.isVisible);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-950 p-4 bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-950">
            <div className="w-full max-w-md mx-auto text-center animate-fade-in-up bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/30 dark:border-slate-800">
                
                <img src={restaurantInfo.logo} alt="logo" className="w-28 h-28 rounded-full mx-auto mb-4 shadow-lg border-4 border-white dark:border-slate-800" />
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-1">{restaurantInfo.name[language]}</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">{restaurantInfo.description[language]}</p>

                <div className="grid grid-cols-2 gap-4 mb-10">
                    {visibleLinks.map((link, index) => (
                        <a 
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col items-center justify-center gap-2 p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl border border-white/50 dark:border-slate-700/50 hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <img src={link.icon} alt={`${link.name} icon`} className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-110" />
                            <span className="font-semibold text-base text-slate-700 dark:text-slate-200">{link.name}</span>
                        </a>
                    ))}
                </div>

                <div>
                    <a
                        href="#/menu"
                        onClick={(e) => handleNav(e, '/menu')}
                        className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 px-10 rounded-full text-lg transition-transform transform hover:scale-105 inline-flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40"
                    >
                        <span>{t.viewMenu}</span>
                        <ChevronRightIcon className={`w-6 h-6 transition-transform ${language === 'ar' ? 'transform -scale-x-100' : ''}`} />
                    </a>
                </div>
            </div>
        </div>
    );
};