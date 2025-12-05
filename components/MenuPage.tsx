import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { normalizeArabic, getDescendantCategoryIds, formatNumber, createSlug } from '../utils/helpers';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';

const ITEMS_PER_PAGE = 20;

export const MenuPage: React.FC = () => {
    const { language, setIsProcessing, t } = useUI();
    const { products, promotions, categories, tags, restaurantInfo } = useData();
    const { addToCart } = useCart();
    const navigate = useNavigate();
    
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory, selectedTags]);

    const handleCartClick = useCallback(() => setIsCartOpen(true), []);
    const handleProductClick = useCallback((product: Product) => {
        navigate(`/product/${createSlug(product.name.en, product.id)}`);
    }, [navigate]);

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
    const displayedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredProducts, currentPage]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            // Scroll to the top of the product list smoothly
            const element = document.getElementById('product-grid-start');
            if (element) {
                const headerOffset = 100;
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        }
    };

    const popularProducts = useMemo(() => visibleProducts.filter(p => p.isPopular).slice(0, 8), [visibleProducts]);
    const newProducts = useMemo(() => visibleProducts.filter(p => p.isNew).slice(0, 4), [visibleProducts]);

    const handleAddToCartWithoutOpeningCart = useCallback((product: Product, quantity: number, options?: { [key: string]: string }) => {
        addToCart(product, quantity, options);
    }, [addToCart]);
      
    
    if (!restaurantInfo) return null;

    const isRtl = language === 'ar';

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

                    <div id="product-grid-start" className="relative z-10">
                        <ProductList 
                            titleKey="fullMenu"
                            products={displayedProducts} 
                            onProductClick={handleProductClick} 
                            addToCart={handleAddToCartWithoutOpeningCart}
                            slider={false}
                            promotions={activePromotions}
                        />
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8 mb-16 animate-fade-in">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                aria-label={t.previous}
                            >
                                {isRtl ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
                            </button>
                            
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                {t.page} {formatNumber(currentPage)} {t.of} {formatNumber(totalPages)}
                            </span>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                aria-label={t.next}
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