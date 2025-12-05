import React, { useState, useEffect } from 'react';
import type { Product, Language, LocalizedString, Category, ProductOption, ProductOptionValue, Tag } from '../../types';
import { PlusIcon, TrashIcon } from '../icons/Icons';
import { Modal } from '../Modal';
import { useUI } from '../../contexts/UIContext';
import { useData } from '../../contexts/DataContext';
import { optimizeImage } from '../../utils/imageOptimizer';

interface ProductEditModalProps {
    product: Product | null;
    onClose: () => void;
    onSave: (productData: Product | Omit<Product, 'id' | 'rating'>, imageFile?: File | null) => void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({ product, onClose, onSave }) => {
    // @FIX: Refactored to get translations `t` directly from the `useUI` hook.
    const { language, t, setIsProcessing, showToast } = useUI();
    const { categories, tags: allTags } = useData();
    
    // FIX: Added missing properties `cost_price`, `stock_quantity`, and `supplier_id` to satisfy the Omit<Product, 'id' | 'rating'> type.
    // FIX: Added `display_order` property to align with the database schema and resolve silent backend errors.
    const emptyProduct: Omit<Product, 'id' | 'rating'> = {
        code: '',
        name: { en: '', ar: '' },
        description: { en: '', ar: '' },
        price: 0,
        cost_price: 0,
        stock_quantity: 0,
        supplier_id: null,
        image: '',
        categoryId: categories[0]?.id || 1,
        isPopular: false,
        isNew: false,
        isVisible: true,
        tags: [],
        options: [],
        display_order: 0,
    };

    const [formData, setFormData] = useState<Omit<Product, 'id' | 'rating'>>(emptyProduct);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    
    useEffect(() => {
        if (product) {
            const { id, rating, ...editableData } = product;
            setFormData({
                ...editableData,
                options: editableData.options ? JSON.parse(JSON.stringify(editableData.options)) : [] // Deep copy
            });
            setImagePreview(product.image);
        } else {
            // For new products, use a state updater to generate a code only if one doesn't exist.
            // This prevents re-generating the code on re-renders caused by other state/prop changes.
            setFormData(prev => ({
                ...prev,
                ...emptyProduct, // Apply latest defaults (like category list)
                code: prev.code || `P${Date.now().toString().slice(-8)}`,
            }));
            setImagePreview('');
        }
        setImageFile(null); // Reset file on modal open
    }, [product, categories]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [field, lang] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [field]: { ...(prev[field as keyof typeof prev] as LocalizedString), [lang]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    }

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleTagChange = (tagId: string) => {
        setFormData(prev => {
            const newTags = prev.tags.includes(tagId)
                ? prev.tags.filter(t => t !== tagId)
                : [...prev.tags, tagId];
            return { ...prev, tags: newTags };
        });
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessing(true);
            try {
                const optimizedFile = await optimizeImage(file, 800, 800);
                setImageFile(optimizedFile);
                setImagePreview(URL.createObjectURL(optimizedFile));
            } catch (error) {
                console.error("Image optimization failed:", error);
                showToast("Image optimization failed. Please try a different image.");
                // Fallback to original file if optimization fails
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
            } finally {
                setIsProcessing(false);
            }
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // The image path in formData is only updated in AdminContext after upload
        if (product) {
             onSave({ ...product, ...formData }, imageFile);
        } else {
             onSave(formData, imageFile);
        }
    };
    
    // --- Option Handlers ---
    const addOptionGroup = () => {
        const newGroup: ProductOption = { name: { en: '', ar: '' }, values: [] };
        setFormData(prev => ({ ...prev, options: [...(prev.options || []), newGroup] }));
    };

    const removeOptionGroup = (groupIndex: number) => {
        setFormData(prev => ({ ...prev, options: prev.options?.filter((_, i) => i !== groupIndex) }));
    };

    const handleOptionGroupChange = (groupIndex: number, field: 'name.en' | 'name.ar', value: string) => {
        const [name, lang] = field.split('.');
        setFormData(prev => {
            const newOptions = [...(prev.options || [])];
            (newOptions[groupIndex].name as any)[lang] = value;
            return { ...prev, options: newOptions };
        });
    };

    const addOptionValue = (groupIndex: number) => {
        const newValue: ProductOptionValue = { name: { en: '', ar: '' }, priceModifier: 0 };
        setFormData(prev => {
            const newOptions = [...(prev.options || [])];
            newOptions[groupIndex].values.push(newValue);
            return { ...prev, options: newOptions };
        });
    };

    const removeOptionValue = (groupIndex: number, valueIndex: number) => {
        setFormData(prev => {
            const newOptions = [...(prev.options || [])];
            newOptions[groupIndex].values = newOptions[groupIndex].values.filter((_, i) => i !== valueIndex);
            return { ...prev, options: newOptions };
        });
    };
    
    const handleOptionValueChange = (groupIndex: number, valueIndex: number, field: 'name.en' | 'name.ar' | 'priceModifier', value: string) => {
         setFormData(prev => {
            const newOptions = [...(prev.options || [])];
            const targetValue = newOptions[groupIndex].values[valueIndex];
            if (field === 'priceModifier') {
                targetValue.priceModifier = parseFloat(value) || 0;
            } else {
                 const [name, lang] = field.split('.');
                (targetValue.name as any)[lang] = value;
            }
            return { ...prev, options: newOptions };
        });
    };

    // @FIX: Replaced JSX.Element with React.ReactElement to fix "Cannot find namespace 'JSX'" error.
    const renderCategoryOptions = (categories: Category[], level: number): React.ReactElement[] => {
        let options: React.ReactElement[] = [];
        const prefix = '\u00A0\u00A0'.repeat(level * 2);
        for (const category of categories) {
            options.push(
                <option key={category.id} value={category.id}>
                    {prefix}{category.name[language]}
                </option>
            );
            if (category.children && category.children.length > 0) {
                options = options.concat(renderCategoryOptions(category.children, level + 1));
            }
        }
        return options;
    };


    return (
        <Modal title={product ? t.editProduct : t.addNewProduct} onClose={onClose} size="2xl">
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.productNameEn}</label>
                        <input type="text" name="name.en" value={formData.name.en} onChange={handleTextChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.productNameAr}</label>
                        <input type="text" name="name.ar" value={formData.name.ar} onChange={handleTextChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required />
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.code}</label>
                    <input type="text" name="code" value={formData.code} onChange={handleTextChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.descriptionEn}</label>
                        <textarea name="description.en" value={formData.description.en} onChange={handleTextChange} rows={3} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required></textarea>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.descriptionAr}</label>
                        <textarea name="description.ar" value={formData.description.ar} onChange={handleTextChange} rows={3} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required></textarea>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.price}</label>
                        <input type="number" name="price" value={formData.price} onChange={handleNumberChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required step="0.01" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.category}</label>
                        <select name="categoryId" value={formData.categoryId} onChange={handleNumberChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" required>
                             {renderCategoryOptions(categories, 0)}
                        </select>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.tags}</label>
                    <div className="p-3 border rounded-md dark:bg-slate-700/50 dark:border-slate-600 flex flex-wrap gap-x-4 gap-y-2">
                        {allTags.map(tag => (
                            <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.tags.includes(tag.id)}
                                    onChange={() => handleTagChange(tag.id)}
                                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 dark:bg-slate-900 dark:border-slate-600"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-200">{tag.name[language]}</span>
                            </label>
                        ))}
                        {allTags.length === 0 && (
                            <p className="text-sm text-slate-500">{language === 'ar' ? 'لا توجد وسوم متاحة. أضف بعضها من صفحة التصنيفات.' : 'No tags available. Add some from the Classifications page.'}</p>
                        )}
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.productImage}</label>
                    <div className="mt-2 flex flex-col sm:flex-row items-center gap-4 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                        {imagePreview && (
                            <img 
                                src={imagePreview} 
                                alt={t.imagePreview} 
                                className="w-32 h-24 object-cover rounded-lg bg-slate-100 dark:bg-slate-700 p-1 border dark:border-slate-600 flex-shrink-0" 
                            />
                        )}
                        <div className="flex-grow text-center sm:text-start">
                            <input
                                id="product-image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="sr-only"
                            />
                            <label 
                                htmlFor="product-image-upload" 
                                className="cursor-pointer bg-white dark:bg-slate-700 text-sm text-primary-600 dark:text-primary-400 font-semibold py-2 px-4 border border-primary-300 dark:border-primary-600 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/50 transition-colors inline-block"
                            >
                                {t.changeImage}
                            </label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{t.uploadImageHelpText}</p> 
                        </div>
                    </div>
                </div>
                 <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="isPopular" checked={formData.isPopular} onChange={handleCheckboxChange} className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.popular}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="isNew" checked={formData.isNew} onChange={handleCheckboxChange} className="w-5 h-5 rounded text-green-600 focus:ring-green-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.new}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="isVisible" checked={formData.isVisible} onChange={handleCheckboxChange} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.visibleInMenu}</span>
                    </label>
                </div>

                {/* Options Editor */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                    <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">{t.productOptions}</h3>
                    <div className="space-y-4">
                        {formData.options?.map((option, groupIndex) => (
                            <div key={groupIndex} className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-700/50 dark:border-slate-600 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">{`Group #${groupIndex + 1}`}</h4>
                                    <button type="button" onClick={() => removeOptionGroup(groupIndex)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" placeholder={t.optionNameEn} value={option.name.en} onChange={e => handleOptionGroupChange(groupIndex, 'name.en', e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" />
                                    <input type="text" placeholder={t.optionNameAr} value={option.name.ar} onChange={e => handleOptionGroupChange(groupIndex, 'name.ar', e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" />
                                </div>
                                <hr className="dark:border-slate-600" />
                                <div className="space-y-2">
                                    <h5 className="text-sm font-medium text-slate-800 dark:text-slate-100">{t.optionValues}</h5>
                                    {option.values.map((value, valueIndex) => (
                                        <div key={valueIndex} className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center">
                                            <input type="text" placeholder={t.valueNameEn} value={value.name.en} onChange={e => handleOptionValueChange(groupIndex, valueIndex, 'name.en', e.target.value)} className="md:col-span-3 w-full p-2 text-sm border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" />
                                            <input type="text" placeholder={t.valueNameAr} value={value.name.ar} onChange={e => handleOptionValueChange(groupIndex, valueIndex, 'name.ar', e.target.value)} className="md:col-span-2 w-full p-2 text-sm border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" />
                                            <input type="number" placeholder={t.priceModifier} value={value.priceModifier} onChange={e => handleOptionValueChange(groupIndex, valueIndex, 'priceModifier', e.target.value)} className="md:col-span-1 w-full p-2 text-sm border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" step="0.01" />
                                            <button type="button" onClick={() => removeOptionValue(groupIndex, valueIndex)} className="md:col-span-1 text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 justify-self-center">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addOptionValue(groupIndex)} className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-semibold flex items-center gap-1">
                                        <PlusIcon className="w-4 h-4" /> {t.addValue}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addOptionGroup} className="mt-4 text-sm font-bold bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
                       <PlusIcon className="w-5 h-5" /> {t.addOptionGroup}
                    </button>
                </div>

                <div className="flex justify-end gap-4 p-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold text-slate-800 dark:text-slate-300 transition-colors">{t.cancel}</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors">{t.save}</button>
                </div>
            </form>
        </Modal>
    );
};