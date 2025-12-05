import React, { useState, useEffect } from 'react';
import type { Product, Category, Tag, Promotion } from '../../../types';
import { useUI } from '../../../contexts/UIContext';
import { useAuth } from '../../../contexts/AuthContext';
import { ProductsListPage } from './ProductsListPage';
import { ClassificationsPage } from '../ClassificationsPage';
import { PromotionsPage } from './PromotionsPage';

interface ProductsAndPromotionsPageProps {
    initialTab: 'productList' | 'classifications' | 'promotions';
    onViewProduct: (product: Product) => void;
    // Products Props
    setEditingProduct: (product: Product | 'new') => void;
    productSearchTerm: string;
    setProductSearchTerm: (term: string) => void;
    productFilterTags: string[];
    handleProductTagChange: (tagId: string) => void;
    productFilterCategory: number | null;
    setProductFilterCategory: (id: number | null) => void;
    categories: Category[];
    tags: Tag[];
    isCategoryOrChildSelected: (category: Category) => boolean;
    openCategoryDropdown: number | null;
    setOpenCategoryDropdown: (id: number | null) => void;
    categoryDropdownRef: React.RefObject<HTMLDivElement>;
    filteredProducts: Product[];
    handleToggleProductFlag: (product: Product, flag: 'isPopular' | 'isNew' | 'isVisible') => void;
    deleteProduct: (productId: number) => void;
    // Classifications Props
    onAddCategory: () => void;
    onEditCategory: (category: Category) => void;
    onAddTag: () => void;
    onEditTag: (tag: Tag) => void;
    // Promotions Props
    setEditingPromotion: (promotion: Promotion | 'new') => void;
    allPromotions: Promotion[];
    allProducts: Product[];
    handleTogglePromotionStatus: (promotion: Promotion) => void;
    deletePromotion: (promotionId: number) => void;
}

type ProductTab = 'products' | 'classifications' | 'promotions';

export const ProductsAndPromotionsPage: React.FC<ProductsAndPromotionsPageProps> = (props) => {
    const { t } = useUI();
    const { hasPermission } = useAuth();
    
    const {
        onViewProduct,
        setEditingProduct, productSearchTerm, setProductSearchTerm,
        productFilterTags, handleProductTagChange, productFilterCategory, setProductFilterCategory,
        categories, tags, isCategoryOrChildSelected, openCategoryDropdown, setOpenCategoryDropdown,
        categoryDropdownRef, filteredProducts, handleToggleProductFlag, deleteProduct,
        onAddCategory, onEditCategory, onAddTag, onEditTag,
        setEditingPromotion, allPromotions, allProducts,
        handleTogglePromotionStatus, deletePromotion,
        initialTab
    } = props;

    const canViewProducts = hasPermission('view_products_page');
    const canViewClassifications = hasPermission('view_classifications_page');
    const canViewPromotions = hasPermission('view_promotions_page');

    const getInitialTab = (): ProductTab => {
        if (initialTab === 'classifications' && canViewClassifications) return 'classifications';
        if (initialTab === 'promotions' && canViewPromotions) return 'promotions';
        if (canViewProducts) return 'products';
        if (canViewClassifications) return 'classifications';
        if (canViewPromotions) return 'promotions';
        return 'products'; // Fallback
    };
    
    const [activeTab, setActiveTab] = useState<ProductTab>(getInitialTab());
    
    useEffect(() => {
        setActiveTab(getInitialTab());
    }, [initialTab, canViewProducts, canViewClassifications, canViewPromotions]);


    return (
        <div>
            <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-6 rtl:space-x-reverse" aria-label="Tabs">
                    {canViewProducts && (
                         <button
                            onClick={() => setActiveTab('products')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'products'
                                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-600'
                            }`}
                        >
                            {t.productList}
                        </button>
                    )}
                   {canViewClassifications && (
                        <button
                            onClick={() => setActiveTab('classifications')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'classifications'
                                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-600'
                            }`}
                        >
                            {t.classifications}
                        </button>
                   )}
                   {canViewPromotions && (
                        <button
                            onClick={() => setActiveTab('promotions')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'promotions'
                                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-600'
                            }`}
                        >
                            {t.managePromotions}
                        </button>
                   )}
                </nav>
            </div>

            {activeTab === 'products' && canViewProducts && (
                 <ProductsListPage
                    hasPermission={hasPermission}
                    setEditingProduct={setEditingProduct}
                    onViewProduct={onViewProduct}
                    productSearchTerm={productSearchTerm}
                    setProductSearchTerm={setProductSearchTerm}
                    productFilterTags={productFilterTags}
                    handleProductTagChange={handleProductTagChange}
                    productFilterCategory={productFilterCategory}
                    setProductFilterCategory={setProductFilterCategory}
                    categories={categories}
                    tags={tags}
                    isCategoryOrChildSelected={isCategoryOrChildSelected}
                    openCategoryDropdown={openCategoryDropdown}
                    setOpenCategoryDropdown={setOpenCategoryDropdown}
                    categoryDropdownRef={categoryDropdownRef}
                    filteredProducts={filteredProducts}
                    handleToggleProductFlag={handleToggleProductFlag}
                    deleteProduct={deleteProduct}
                />
            )}
            {activeTab === 'classifications' && canViewClassifications && (
                <ClassificationsPage
                    onAddCategory={onAddCategory}
                    onEditCategory={onEditCategory}
                    onAddTag={onAddTag}
                    onEditTag={onEditTag}
                />
            )}
            {activeTab === 'promotions' && canViewPromotions && (
                <PromotionsPage
                    hasPermission={hasPermission}
                    setEditingPromotion={setEditingPromotion}
                    allPromotions={allPromotions}
                    allProducts={allProducts}
                    handleTogglePromotionStatus={handleTogglePromotionStatus}
                    deletePromotion={deletePromotion}
                />
            )}
        </div>
    );
};