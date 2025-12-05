
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Product, CartItem, Order, OrderStatus, OrderType, Category, Promotion } from '../types';
import { Header } from './Header';
import { SearchAndFilter } from './SearchAndFilter';
import { ProductList } from './ProductList';
import { CartSidebar } from './CartSidebar';
import { PromotionSection } from './PromotionSection';
import { Footer } from './Footer';
import { HeroSection } from './HeroSection';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useCart } from '../contexts/CartContext';
import { normalizeArabic, getDescendantCategoryIds } from '../utils/helpers';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';
import { usePersistentState } from '../hooks/usePersistentState';

const ITEMS_PER_PAGE = 20;

export const MenuPage: React.FC = () => {
    const { language, setIsProcessing, t } = useUI();
    const { products, promotions, categories, tags, restaurantInfo } = useData();
    const { addToCart } = useCart();
    
    const [isCartOpen, setIsCartOpen] = useState(false);
    
    // Persist Filter States so user returns to exact same view
    const [searchTerm, setSearchTerm] = usePersistentState<string>('menu_search_term', '');
    const [selectedCategory, setSelectedCategory] = usePersistentState<number | null>('menu_selected_category', null);
    const [selectedTags, setSelectedTags] = usePersistentState<string[]>('menu_selected_tags', []);
    
    // Pagination State - Persisted to remember page number on navigation
    const [currentPage, setCurrentPage] = usePersistentState<number>('menu_current_page', 1);

    // Ref to track first render to avoid resetting page on mount
    const isFirstRender = useRef(true);

    const handleCartClick = useCallback(() => setIsCartOpen(true), []);
    const handleProductClick = useCallback((product: Product) => {
        window.location.hash = `#/product/${product.id}`;
    }, []);

    // Reset pagination when filters change, BUT skip the first render (restoration from storage)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        // Only reset if we are not already on page 1 to avoid unnecessary state updates/renders
        if (currentPage !== 1) {
             setCurrentPage(1);
        }
    }, [searchTerm, selectedCategory, selectedTags]);

    const visibleProducts = useMemo(() => products.filter(p => p.isVisible), [products]);
    
    const activePromotions = useMemo(() => {
        const now = new Date();
        return promotions.filter(p => p.isActive && new Date(p.endDate) > now);
    }, [promotions]);

    const filteredProducts = useMemo(() => {
        return visibleProducts.filter(product => {
          const name = product.name[language] || product.name['en'];
          const description = product.description[language] || product.description['en'];
    
          const normalizedSearchTerm = normalizeArabic(searchTerm.toLowerCase());
          const matchesSearch = normalizeArabic(name.toLowerCase()).includes(normalizedSearchTerm) || 
                                normalizeArabic(description.toLowerCase()).includes(normalizedSearchTerm);
          
          let matchesCategory = true;
          if (selectedCategory !== null) {
              const categoryIdsToMatch = getDescendantCategoryIds(selectedCategory, categories);
              matchesCategory = categoryIdsToMatch.includes(product.categoryId);
          }

          const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => product.tags.includes(tag));
          
          return matchesSearch && matchesCategory && matchesTags;
        });
      }, [searchTerm, selectedCategory, selectedTags, language, visibleProducts, categories]);
      
    // Pagination Logic
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    
    // Ensure currentPage is valid (e.g. if filtered results shrink)
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage, setCurrentPage]);

    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredProducts, currentPage]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            // Scroll to the top of the product list
            const listElement = document.getElementById('full-menu-list');
            if (listElement) {
                listElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    const popularProducts = useMemo(() => visibleProducts.filter(p => p.isPopular).slice(0, 8), [visibleProducts]);
    const newProducts = useMemo(() => visibleProducts.filter(p => p.isNew).slice(0, 4), [visibleProducts]);

    const handleAddToCartWithoutOpeningCart = useCallback((product: Product, quantity: number, options?: { [key: string]: string }) => {
        addToCart(product, quantity, options);
    }, [addToCart]);
      
    const isRtl = language === 'ar';

    if (!restaurantInfo) return null;

    return (
        <>
            <Header onCartClick={handleCartClick} />
            
            <HeroSection />

            <div className="container mx-auto max-w-7xl px-4">
                <main>
                    <PromotionSection promotions={promotions} products={visibleProducts} onProductClick={handleProductClick} />

                    <ProductList 
                        titleKey="mostPopular" 
                        products={popularProducts} 
                        onProductClick={handleProductClick} 
                        addToCart={handleAddToCartWithoutOpeningCart}
                        slider={true}
                        promotions={activePromotions}
                    />

                    <ProductList 
                        titleKey="newItems"
                        products={newProducts} 
                        onProductClick={handleProductClick} 
                        addToCart={handleAddToCartWithoutOpeningCart}
                        promotions={activePromotions}
                    />
                    
                    <SearchAndFilter
                        language={language}
                        categories={categories}
                        tags={tags}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        selectedTags={selectedTags}
                        setSelectedTags={setSelectedTags}
                    />

                    <div id="full-menu-list" className="relative z-10 scroll-mt-24">
                        <ProductList 
                            titleKey="fullMenu"
                            products={paginatedProducts} 
                            onProductClick={handleProductClick} 
                            addToCart={handleAddToCartWithoutOpeningCart}
                            slider={false}
                            promotions={activePromotions}
                        />
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8 pb-8 animate-fade-in">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-3 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary-500 hover:text-white disabled:opacity-50 disabled:hover:bg-slate-200 disabled:cursor-not-allowed transition-all"
                                aria-label="Previous Page"
                            >
                                {isRtl ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
                            </button>
                            
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                {currentPage} <span className="mx-1 text-slate-400">/</span> {totalPages}
                            </span>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-3 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary-500 hover:text-white disabled:opacity-50 disabled:hover:bg-slate-200 disabled:cursor-not-allowed transition-all"
                                aria-label="Next Page"
                            >
                                {isRtl ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    )}
                </main>
            </div>

            <Footer />

            <CartSidebar
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
            />
        </>
    )
}
