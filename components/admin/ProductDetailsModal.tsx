import React from 'react';
import type { Product, Category } from '../../types';
import { Modal } from '../Modal';
import { useUI } from '../../contexts/UIContext';
import { useData } from '../../contexts/DataContext';
import { PencilIcon, TrashIcon } from '../icons/Icons';

interface ProductDetailsModalProps {
    product: Product;
    onClose: () => void;
    onEdit: (product: Product) => void;
    onDelete: (productId: number) => void;
    onToggleFlag: (product: Product, flag: 'isPopular' | 'isNew' | 'isVisible') => void;
    canEdit: boolean;
    canDelete: boolean;
}

const FlagToggle: React.FC<{ label: string; isChecked: boolean; onToggle: () => void; disabled: boolean; }> = ({ label, isChecked, onToggle, disabled }) => (
    <label className="flex items-center gap-3 cursor-pointer">
        <input 
            type="checkbox" 
            checked={isChecked} 
            onChange={onToggle}
            disabled={disabled}
            className="sr-only peer"
        />
        <div className="relative w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    </label>
);

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, onClose, onEdit, onDelete, onToggleFlag, canEdit, canDelete }) => {
    const { t, language } = useUI();
    const { categories, tags } = useData();

    const categoryName = categories.flatMap(function flatten(c): Category[] { return [c, ...(c.children || []).flatMap(flatten)] }).find(c => c.id === product.categoryId)?.name[language] || 'N/A';
    const productTags = tags.filter(tag => product.tags.includes(tag.id));

    return (
        <Modal title={product.name[language]} onClose={onClose} size="3xl">
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[75vh] overflow-y-auto">
                {/* Left Column: Image & Flags */}
                <div className="md:col-span-1 space-y-6">
                    <img src={product.image} alt={product.name[language]} className="w-full rounded-lg shadow-lg object-cover aspect-square" />
                    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100">{t.status}</h4>
                        <FlagToggle label={t.visibleInMenu} isChecked={product.isVisible} onToggle={() => onToggleFlag(product, 'isVisible')} disabled={!canEdit} />
                        <FlagToggle label={t.popular} isChecked={product.isPopular} onToggle={() => onToggleFlag(product, 'isPopular')} disabled={!canEdit} />
                        <FlagToggle label={t.new} isChecked={product.isNew} onToggle={() => onToggleFlag(product, 'isNew')} disabled={!canEdit} />
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="md:col-span-2 space-y-4">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.productNameEn}</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{product.name.en}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.productNameAr}</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{product.name.ar}</p>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.code}</p>
                            <p className="font-mono text-sm text-slate-700 dark:text-slate-200">{product.code}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.category}</p>
                            <p className="font-semibold text-slate-700 dark:text-slate-200">{categoryName}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.price}</p>
                            <p className="font-bold text-lg text-primary-600 dark:text-primary-400">{product.price.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.costPrice}</p>
                            <p className="font-semibold text-slate-700 dark:text-slate-200">{product.cost_price.toFixed(2)}</p>
                        </div>
                         <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.stockQuantity}</p>
                            <p className="font-semibold text-slate-700 dark:text-slate-200">{product.stock_quantity}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.descriptionEn}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{product.description.en}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.descriptionAr}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{product.description.ar}</p>
                    </div>
                    
                    {productTags.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{t.tags}</p>
                            <div className="flex flex-wrap gap-2">
                                {productTags.map(tag => (
                                    <span key={tag.id} className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                        {tag.name[language]}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {(canEdit || canDelete) && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-4">
                    {canDelete && (
                        <button onClick={() => { onDelete(product.id); onClose(); }} className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 font-semibold flex items-center gap-2">
                            <TrashIcon className="w-5 h-5" /> {t.delete}
                        </button>
                    )}
                    {canEdit && (
                         <button onClick={() => onEdit(product)} className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 font-semibold flex items-center gap-2">
                            <PencilIcon className="w-5 h-5" /> {t.edit}
                        </button>
                    )}
                </div>
            )}
        </Modal>
    );
};