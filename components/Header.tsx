
import React, { useState, useEffect, useRef } from 'react';
import { SunIcon, MoonIcon, CartIcon, LanguageIcon, UserIcon, FullscreenIcon, ExitFullscreenIcon, ShieldCheckIcon, LogoutIcon, InstallIcon } from './icons/Icons';
import { formatNumber } from '../utils/helpers';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useCart } from '../contexts/CartContext';

interface HeaderProps {
  onCartClick: () => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({ onCartClick }) => {
  const { language, theme, toggleLanguage, toggleTheme, t, installPromptEvent, triggerInstallPrompt } = useUI();
  const { currentUser, logout, isAdmin } = useAuth();
  const { restaurantInfo } = useData();
  const { cartItems } = useCart();
  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(() => {
    const doc = document as any;
    return !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
  });
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    setIsUserMenuOpen(false); // Close menu on navigation
    window.location.hash = path;
  };

  const toggleFullscreen = () => {
    const docEl = document.documentElement as any;
    const doc = document as any;

    if (!isFullscreen) {
        if (docEl.requestFullscreen) {
            docEl.requestFullscreen().catch((err: Error) => console.error(err));
        } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
            docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
            docEl.msRequestFullscreen();
        }
    } else {
        if (doc.exitFullscreen) {
            doc.exitFullscreen().catch((err: Error) => console.error(err));
        } else if (doc.webkitExitFullscreen) {
            doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
            doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
            doc.msExitFullscreen();
        }
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
        const doc = document as any;
        const isInFullScreen = !!(
            doc.fullscreenElement ||
            doc.webkitFullscreenElement ||
            doc.mozFullScreenElement ||
            doc.msFullscreenElement
        );
        setIsFullscreen(isInFullScreen);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('mozfullscreenchange', onFullscreenChange);
      document.removeEventListener('MSFullscreenChange', onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      setIsUserMenuOpen(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  if (!restaurantInfo) return null;

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-md border-b border-slate-200 dark:border-slate-800' : 'bg-transparent'}`}>
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex justify-between items-center h-20">
          <a href="#/" onClick={(e) => handleNav(e, '/')} className="flex items-center gap-3 cursor-pointer group">
            <img src={restaurantInfo.logo} alt="logo" className="h-12 w-12 rounded-full object-cover transition-transform group-hover:scale-110" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{restaurantInfo.name[language]}</h1>
          </a>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={toggleFullscreen} className="hidden sm:flex p-2 h-10 w-10 items-center justify-center rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors" aria-label="Toggle fullscreen">
              {isFullscreen ? <ExitFullscreenIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" /> : <FullscreenIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />}
            </button>

             {installPromptEvent && (
                <button 
                    onClick={triggerInstallPrompt} 
                    className="p-2 h-10 items-center justify-center rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors flex gap-2 sm:w-auto sm:px-3" 
                    aria-label={t.installApp}
                    title={t.installApp}
                >
                    <InstallIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    <span className="hidden sm:inline text-xs font-semibold text-slate-700 dark:text-slate-200">{t.installApp}</span>
                </button>
            )}

            <button onClick={onCartClick} className="relative p-2 h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors" aria-label="Open cart">
              <CartIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transform translate-x-1/4 -translate-y-1/4 ring-2 ring-white dark:ring-slate-900">
                  {formatNumber(cartItemCount)}
                </span>
              )}
            </button>

            <div className="h-6 w-px mx-2 bg-slate-200 dark:bg-slate-700"></div>

            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(prev => !prev)} 
                className="p-2 h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                aria-haspopup="true"
                aria-expanded={isUserMenuOpen}
                aria-label="User menu"
              >
                <UserIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute top-full mt-2 end-0 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in py-1">
                  {currentUser ? (
                    <>
                      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                        <p className="font-semibold text-sm truncate text-slate-800 dark:text-slate-100">{currentUser.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{t[currentUser.role as keyof typeof t] || currentUser.role}</p>
                      </div>
                       {isAdmin && (
                        <a href="#/admin" onClick={(e) => handleNav(e, '/admin')} className="flex items-center gap-3 w-full text-start px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                          <ShieldCheckIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                          <span>{t.adminPanel}</span>
                        </a>
                      )}
                      <a href="#/profile" onClick={(e) => handleNav(e, '/profile')} className="flex items-center gap-3 w-full text-start px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <UserIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        <span>{t.myProfile}</span>
                      </a>
                      <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="flex items-center gap-3 w-full text-start px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors">
                        <LogoutIcon className="w-5 h-5" />
                        <span>{t.logout}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <a href="#/login" onClick={(e) => handleNav(e, '/login')} className="block w-full text-start px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">{t.login}</a>
                    </>
                  )}
                  <hr className="my-1 border-slate-200 dark:border-slate-700" />
                  <button onClick={() => { toggleLanguage(); setIsUserMenuOpen(false); }} className="flex items-center gap-3 w-full text-start px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <LanguageIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <span>{t.language}</span>
                    <span className="ms-auto text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded-full">{language === 'en' ? 'ع' : 'En'}</span>
                  </button>
                  <button onClick={() => { toggleTheme(); setIsUserMenuOpen(false); }} className="flex items-center gap-3 w-full text-start px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                     {theme === 'light' ? <MoonIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" /> : <SunIcon className="w-5 h-5 text-yellow-400" />}
                    <span>{t.theme}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});