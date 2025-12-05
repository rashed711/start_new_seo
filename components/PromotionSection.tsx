import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import type { Promotion, Product } from '../types';
import { useCountdown } from '../hooks/useCountdown';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';
import { useUI } from '../contexts/UIContext';

interface PromotionCardProps {
  promotion: Promotion;
  product: Product;
  onProductClick: (product: Product) => void;
}

const PromotionCard: React.FC<PromotionCardProps> = ({ promotion, product, onProductClick }) => {
    const { t, language } = useUI();
    const { days, hours, minutes, seconds } = useCountdown(promotion.endDate);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    if (!product) {
        return null;
    }
    
    const discountedPrice = product.price * (1 - promotion.discountPercent / 100);

    return (
        <div onClick={() => onProductClick(product)} className="bg-gradient-to-br from-primary-500 to-primary-700 h-full text-white rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row items-center gap-6 lg:gap-8 shadow-xl hover:shadow-2xl hover:shadow-primary-500/40 cursor-pointer transform hover:scale-105 transition-all duration-300 min-h-72">
            <div className="relative w-full md:w-36 h-48 md:h-36 rounded-xl md:rounded-full flex-shrink-0 border-4 border-primary-300 overflow-hidden">
                {!isImageLoaded && <div className="absolute inset-0 bg-primary-400/50 animate-pulse"></div>}
                <img 
                    src={product.image} 
                    alt={product.name[language]} 
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    loading="lazy"
                    onLoad={() => setIsImageLoaded(true)}
                />
            </div>
            <div className="flex flex-col flex-1 justify-center text-center md:text-start">
                <div>
                    <div>
                        <h3 className="text-2xl lg:text-3xl font-bold">{promotion.title[language]}</h3>
                        <p className="mt-1 lg:mt-2 opacity-90 line-clamp-2">{promotion.description[language]}</p>
                        <div className="flex items-baseline gap-2 mt-2 lg:mt-3 justify-center md:justify-start">
                            <span className="text-3xl lg:text-4xl font-extrabold">{discountedPrice.toFixed(2)} {t.currency}</span>
                            <span className="line-through text-lg lg:text-xl opacity-80">{product.price.toFixed(2)} {t.currency}</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="font-semibold uppercase text-sm opacity-90">{t.expiresIn}</p>
                        <div className="flex rtl:flex-row-reverse gap-2 text-2xl font-mono font-bold mt-1 justify-center md:justify-start">
                            <div className="bg-white/20 p-2 lg:py-2 lg:px-3 rounded-md min-w-12 lg:min-w-14 text-center">{String(days).padStart(2,'0')}<span className="text-xs block">{t.days}</span></div>
                            <div className="bg-white/20 p-2 lg:py-2 lg:px-3 rounded-md min-w-12 lg:min-w-14 text-center">{String(hours).padStart(2,'0')}<span className="text-xs block">{t.hours}</span></div>
                            <div className="bg-white/20 p-2 lg:py-2 lg:px-3 rounded-md min-w-12 lg:min-w-14 text-center">{String(minutes).padStart(2,'0')}<span className="text-xs block">{t.minutes}</span></div>
                            <div className="bg-white/20 p-2 lg:py-2 lg:px-3 rounded-md min-w-12 lg:min-w-14 text-center">{String(seconds).padStart(2,'0')}<span className="text-xs block">{t.seconds}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

interface PromotionSectionProps {
  promotions: Promotion[];
  products: Product[];
  onProductClick: (product: Product) => void;
}

export const PromotionSection: React.FC<PromotionSectionProps> = ({ promotions, products, onProductClick }) => {
  const { t, language } = useUI();
  const sliderRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const isRtl = language === 'ar';
  
  const displayablePromotions = useMemo(() => {
    const now = new Date();
    return promotions
      .map(promo => {
        const product = products.find(p => p.id === promo.productId);
        if (!promo.isActive || new Date(promo.endDate) <= now || !product || !product.isVisible) {
          return null;
        }
        return { promo, product };
      })
      .filter((item): item is { promo: Promotion; product: Product } => item !== null);
  }, [promotions, products]);

  const handleScroll = (direction: 'prev' | 'next') => {
    if (sliderRef.current?.children[0]) {
      const slider = sliderRef.current;
      const card = slider.children[0] as HTMLElement;
      let scrollAmount = card.offsetWidth;
      if (direction === 'prev') {
        scrollAmount = -scrollAmount;
      }
      
      slider.scrollBy({ left: isRtl ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollNext = useCallback(() => {
    if (sliderRef.current?.children[0]) {
      const slider = sliderRef.current;
      const cardWidth = (slider.children[0] as HTMLElement).offsetWidth;
      const maxScroll = slider.scrollWidth - slider.clientWidth;

      const isAtEnd = isRtl
        ? Math.abs(slider.scrollLeft) >= maxScroll - 5
        : slider.scrollLeft >= maxScroll - 5;

      if (isAtEnd) {
        // Jump instantly back to the start. This is the most reliable way to create an endless loop.
        slider.scrollTo({ left: 0, behavior: 'instant' });
      } else {
        // Smoothly scroll to the next item.
        slider.scrollBy({ left: isRtl ? -cardWidth : cardWidth, behavior: 'smooth' });
      }
    }
  }, [isRtl]);

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(scrollNext, 5000); // Slower interval for a smoother experience
  }, [scrollNext]);

  const stopAutoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    if (displayablePromotions.length > 1) {
        startAutoPlay();
    }
    return () => stopAutoPlay();
  }, [startAutoPlay, displayablePromotions.length]);
  
  if (displayablePromotions.length === 0) {
    return null;
  }

  return (
    <section className="my-12 animate-fade-in-up">
        <h2 className="text-3xl font-extrabold mb-8 text-slate-900 dark:text-slate-200">{t.todaysOffers}</h2>
        <div className="relative -mx-4" onMouseEnter={stopAutoPlay} onMouseLeave={startAutoPlay} onTouchStart={stopAutoPlay} onTouchEnd={startAutoPlay}>
            <div ref={sliderRef} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide px-2">
                {displayablePromotions.map(({ promo, product }) => {
                    return (
                        <div key={promo.id} className="w-5/6 md:w-1/2 lg:w-5/12 xl:w-1/2 flex-shrink-0 snap-center p-2">
                             <PromotionCard promotion={promo} product={product} onProductClick={onProductClick} />
                        </div>
                    );
                })}
            </div>
            {displayablePromotions.length > 1 && (
                <>
                    <button
                        onClick={() => handleScroll('prev')}
                        className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-4' : 'left-4'} z-10 p-2 bg-white/70 dark:bg-slate-900/70 rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-900 transition-colors`}
                        aria-label="Previous Offer"
                    >
                        {isRtl ? <ChevronRightIcon className="w-6 h-6" /> : <ChevronLeftIcon className="w-6 h-6" />}
                    </button>
                    <button
                        onClick={() => handleScroll('next')}
                        className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-4' : 'right-4'} z-10 p-2 bg-white/70 dark:bg-slate-900/70 rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-900 transition-colors`}
                        aria-label="Next Offer"
                    >
                        {isRtl ? <ChevronLeftIcon className="w-6 h-6" /> : <ChevronRightIcon className="w-6 h-6" />}
                    </button>
                </>
            )}
        </div>
    </section>
  )
}
