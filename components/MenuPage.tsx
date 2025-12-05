import React, { useState, useMemo, useCallback } from 'react';
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

export const MenuPage: React.FC = () => {
    const { language, setIsProcessing, t } = useUI();
    const { products, promotions, categories, tags, restaurantInfo } = useData();
    const { addToCart } = useCart();
    
    const [isCartOpen, setIsCartOpen] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const handleCartClick = useCallback(() => setIsCartOpen(true), []);
    const handleProductClick = useCallback((product: Product) => {
        window.location.hash = `#/product/${product.id}`;
    }, []);

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
      
    const popularProducts = useMemo(() => visibleProducts.filter(p => p.isPopular).slice(0, 8), [visibleProducts]);
    const newProducts = useMemo(() => visibleProducts.filter(p => p.isNew).slice(0, 4), [visibleProducts]);

    const handleAddToCartWithoutOpeningCart = useCallback((product: Product, quantity: number, options?: { [key: string]: string }) => {
        addToCart(product, quantity, options);
    }, [addToCart]);
      
    
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

                    <div className="relative z-10">
                        <ProductList 
                            titleKey="fullMenu"
                            products={filteredProducts} 
                            onProductClick={handleProductClick} 
                            addToCart={handleAddToCartWithoutOpeningCart}
                            slider={false}
                            promotions={activePromotions}
                        />
                    </div>
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