import React from 'react';
import type { Language, Product, Category, Tag } from '../../../types';
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon, ChevronRightIcon } from '../../icons/Icons';
import { useUI } from '../../../contexts/UIContext';

interface ProductsListPageProps {
    hasPermission: (permission: string) => boolean;
    setEditingProduct: (product: Product | 'new') => void;
    onViewProduct: (product: Product) => void;
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
}

export const ProductsListPage: React.FC<ProductsListPageProps> = (props) => {
    const { t, language } = useUI();
    const {
        hasPermission, setEditingProduct, onViewProduct, productSearchTerm, setProductSearchTerm,
        productFilterTags, handleProductTagChange, productFilterCategory, setProductFilterCategory,
        categories, tags, isCategoryOrChildSelected, openCategoryDropdown, setOpenCategoryDropdown,
        categoryDropdownRef, filteredProducts, handleToggleProductFlag, deleteProduct
    } = props;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.productList}</h2>
                {hasPermission('add_product') && <button onClick={() => setEditingProduct('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"><PlusIcon className="w-5 h-5" />{t.addNewProduct}</button>}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 border border-slate-200 dark:border-slate-700 space-y-4 -mb-[280px]">
                {/* Combined Search and Tags */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-grow min-w-[250px] sm:min-w-[300px]">
                        <input type="text" placeholder={`${t.productNameEn}, ${t.code}...`} value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)} className="w-full p-2 ps-10 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"/>
                        <div className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400"><SearchIcon className="w-5 h-5" /></div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        {tags.map(tag => (
                            <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={productFilterTags.includes(tag.id)}
                                    onChange={() => handleProductTagChange(tag.id)}
                                    className="sr-only peer"
                                />
                                <span className="px-3 py-1.5 whitespace-nowrap rounded-full text-xs font-semibold border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 peer-checked:bg-primary-100 dark:peer-checked:bg-primary-900/50 peer-checked:border-primary-500 peer-checked:text-primary-700 dark:peer-checked:text-primary-300 transition-colors">
                                    {tag.name[language]}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Categories */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.category}</label>
                    <div className="flex items-start gap-2 overflow-x-auto scrollbar-hide py-2 pb-[280px] pointer-events-none">
                        <button
                            onClick={() => setProductFilterCategory(null)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap pointer-events-auto ${productFilterCategory === null ? 'bg-primary-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                        >
                            {t.allCategories}
                        </button>
                        {categories.map(category => {
                            const hasChildren = category.children && category.children.length > 0;
                            const isActive = isCategoryOrChildSelected(category);

                            if (hasChildren) {
                                return (
                                    <div key={category.id} className="relative pointer-events-auto" ref={openCategoryDropdown === category.id ? categoryDropdownRef : null}>
                                        <button
                                            onClick={() => {
                                                setOpenCategoryDropdown(openCategoryDropdown === category.id ? null : category.id);
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${isActive ? 'bg-primary-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                                        >
                                            <span>{category.name[language]}</span>
                                            <ChevronRightIcon className={`w-4 h-4 transition-transform ${language === 'ar' ? 'transform -scale-x-100' : ''} ${openCategoryDropdown === category.id ? 'rotate-90' : ''}`} />
                                        </button>
                                        {openCategoryDropdown === category.id && (
                                            <div className="absolute top-full mt-2 z-[60] min-w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 animate-fade-in py-1 max-h-60 overflow-y-auto">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setProductFilterCategory(category.id); setOpenCategoryDropdown(null); }}
                                                    className={`block w-full text-start px-4 py-2 text-sm transition-colors ${productFilterCategory === category.id && (!category.children || !category.children.some(c => c.id === productFilterCategory)) ? 'font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/40' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                                >
                                                    {t.all} {category.name[language]}
                                                </button>
                                                {category.children!.map(child => (
                                                    <button
                                                        key={child.id}
                                                        onClick={(e) => { e.stopPropagation(); setProductFilterCategory(child.id); setOpenCategoryDropdown(null); }}
                                                        className={`block w-full text-start px-4 py-2 text-sm transition-colors ${productFilterCategory === child.id ? 'font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/40' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                                    >
                                                        {child.name[language]}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <button
                                    key={category.id}
                                    onClick={() => setProductFilterCategory(category.id)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap pointer-events-auto ${productFilterCategory === category.id ? 'bg-primary-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                                >
                                    {category.name[language]}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="relative z-0 pt-4">
                {/* Desktop Table */}
                <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.product}</th>
                                <th scope="col" className="px-4 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.stockQuantity}</th>
                                <th scope="col" className="px-4 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.costPrice}</th>
                                <th scope="col" className="px-4 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.price}</th>
                                <th scope="col" className="px-4 py-4 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.visibleInMenu}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} onClick={() => onViewProduct(product)} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-800 dark:even:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><img src={product.image} alt={product.name[language]} className="w-12 h-12 rounded-md object-cover me-4" loading="lazy" /><div><div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{product.name[language]}</div><div className="text-xs text-slate-500 dark:text-slate-400">{product.code}</div></div></div></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-300">{product.stock_quantity}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{product.cost_price.toFixed(2)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-primary-600 dark:text-primary-400">{product.price.toFixed(2)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                        <div className={`inline-block w-4 h-4 rounded-full ${product.isVisible ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {filteredProducts.map(product => (
                        <div key={product.id} onClick={() => onViewProduct(product)} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 space-y-4 border-l-4 border-primary-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <img src={product.image} alt={product.name[language]} className="w-16 h-16 rounded-md object-cover flex-shrink-0" loading="lazy" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{product.name[language]}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{product.code}</p>
                                        <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{product.price.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 text-xs">
                                    <span className="font-semibold">{t.stockQuantity}: <span className="font-bold text-slate-800 dark:text-slate-100">{product.stock_quantity}</span></span>
                                    <span className="font-semibold">{t.costPrice}: <span className="font-bold text-slate-800 dark:text-slate-100">{product.cost_price.toFixed(2)}</span></span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};