import React, { useState } from 'react';
import type { Language, RestaurantInfo } from '../types';
import { useUI } from '../contexts/UIContext';
import { useData } from '../contexts/DataContext';

interface HeroSectionProps {}

export const HeroSection: React.FC<HeroSectionProps> = () => {
  const { t, language } = useUI();
  const { restaurantInfo } = useData(); // Assuming restaurantInfo is available in UIContext or DataContext
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleScrollToMenu = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const menuElement = document.getElementById('menu');
    if (menuElement) {
      menuElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    window.location.hash = path;
  };
  
  if (!restaurantInfo) return null;

  return (
    <section className="relative h-[60vh] min-h-[400px] max-h-[600px] flex items-center justify-center text-white text-center bg-slate-800">
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10 z-10"></div>
      
      {!isImageLoaded && <div className="absolute inset-0 w-full h-full bg-slate-700 animate-pulse"></div>}
      <img 
        src={restaurantInfo.heroImage} 
        alt="Delicious food spread" 
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsImageLoaded(true)}
      />
      <div className="relative z-20 p-4 animate-fade-in-up">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
          {restaurantInfo.heroTitle?.[language] || ''}
        </h1>
        <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
          {restaurantInfo.description?.[language] || ''}
        </p>
        <div className="flex flex-row items-center justify-center gap-2 sm:gap-3">
          <a 
            href="#menu"
            onClick={handleScrollToMenu}
            className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 sm:py-2.5 sm:px-6 rounded-full text-sm sm:text-base transition-transform transform hover:scale-105 inline-block shadow-lg shadow-primary-500/30 whitespace-nowrap"
          >
            {t.viewMenu}
          </a>
          <a 
            href="#/track"
            onClick={(e) => handleNav(e, '/track')}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white text-white font-bold py-2 px-4 sm:py-2.5 sm:px-6 rounded-full text-sm sm:text-base transition-colors transform hover:scale-105 inline-block shadow-lg whitespace-nowrap"
          >
            {t.trackOrder}
          </a>
           <a 
            href="#/social"
            onClick={(e) => handleNav(e, '/social')}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white text-white font-bold py-2 px-4 sm:py-2.5 sm:px-6 rounded-full text-sm sm:text-base transition-colors transform hover:scale-105 inline-block shadow-lg whitespace-nowrap"
          >
            {t.contactUs}
          </a>
        </div>
      </div>
    </section>
  );
};