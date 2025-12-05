import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import type { Product, Category, Tag, Promotion, RestaurantInfo, SocialLink, OnlinePaymentMethod, OrderStatusColumn, LocalizedString } from '../types';
import { restaurantInfo as fallbackRestaurantInfo, initialCategories, initialTags } from '../data/mockData';
import { APP_CONFIG } from '../utils/config';
import { useUI } from './UIContext';
import { resolveImageUrl } from '../utils/helpers';
// DataContext now needs useAuth for permissions checks
import { useAuth } from './AuthContext';

interface DataContextType {
    restaurantInfo: RestaurantInfo | null;
    products: Product[];
    categories: Category[];
    tags: Tag[];
    promotions: Promotion[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>>;
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
    fetchAllData: (isInitialLoad?: boolean) => Promise<void>;
    updateRestaurantInfo: (updatedInfo: Partial<RestaurantInfo>) => Promise<void>;
    addProduct: (productData: Omit<Product, 'id' | 'rating'>, imageFile?: File | null) => Promise<void>;
    updateProduct: (updatedProduct: Product, imageFile?: File | null) => Promise<void>;
    deleteProduct: (productId: number) => Promise<void>;
    addPromotion: (promotionData: Omit<Promotion, 'id'>) => Promise<void>;
    updatePromotion: (updatedPromotion: Promotion) => Promise<void>;
    deletePromotion: (promotionId: number) => Promise<void>;
    addCategory: (categoryData: Omit<Category, 'id'>) => Promise<void>;
    updateCategory: (categoryData: Category) => Promise<void>;
    updateCategoryOrder: (orderedCategories: Category[]) => Promise<void>;
    deleteCategory: (categoryId: number) => Promise<void>;
    addTag: (tagData: Omit<Tag, 'id'> & { id: string }) => Promise<void>;
    updateTag: (tagData: Tag) => Promise<void>;
    deleteTag: (tagId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const dataUrlToFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error('Invalid data URL');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { setIsLoading, setShowProgress, setProgress, showToast, t, setIsProcessing, language } = useUI();
    // Getting hasPermission from useAuth
    const { hasPermission } = useAuth();
    
    const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [tags, setTags] = useState<Tag[]>(initialTags);
    const [promotions, setPromotions] = useState<Promotion[]>([]);

    const fetchAllData = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) setIsLoading(true); else { setShowProgress(true); setProgress(0); }

        try {
            let progressInterval: number | undefined;
            if (!isInitialLoad) {
                progressInterval = window.setInterval(() => setProgress(p => Math.min(p + 20, 90)), 80);
            }

            const fetchOptions = { method: 'GET' };

            const [settingsRes, classificationsRes, promotionsRes, productsRes] = await Promise.all([
                fetch(`${APP_CONFIG.API_BASE_URL}get_settings.php`, fetchOptions),
                fetch(`${APP_CONFIG.API_BASE_URL}get_classifications.php`, fetchOptions),
                fetch(`${APP_CONFIG.API_BASE_URL}get_promotions.php`, fetchOptions),
                fetch(`${APP_CONFIG.API_BASE_URL}get_products.php`, fetchOptions),
            ]);

            if (progressInterval) clearInterval(progressInterval);

            if (settingsRes.ok) {
                const data = await settingsRes.json();
                
                if (data.activationEndDate && typeof data.activationEndDate === 'string') {
                    if (data.activationEndDate.startsWith('0000-00-00')) {
                        data.activationEndDate = null;
                    } else {
                        const utcDateString = data.activationEndDate.replace(' ', 'T') + 'Z';
                        const dateObj = new Date(utcDateString);
                        if (!isNaN(dateObj.getTime())) {
                            data.activationEndDate = dateObj.toISOString();
                        } else {
                            data.activationEndDate = null;
                        }
                    }
                }
                
                if (data.deactivationMessage && typeof data.deactivationMessage === 'string') {
                    try {
                        data.deactivationMessage = JSON.parse(data.deactivationMessage);
                    } catch (e) {
                        data.deactivationMessage = { en: data.deactivationMessage, ar: data.deactivationMessage };
                    }
                }
                
                data.logo = resolveImageUrl(data.logo);
                data.heroImage = resolveImageUrl(data.heroImage);
                if (data.socialLinks) data.socialLinks = data.socialLinks.map((l: SocialLink) => ({ ...l, icon: resolveImageUrl(l.icon) }));
                if (data.onlinePaymentMethods) data.onlinePaymentMethods = data.onlinePaymentMethods.map((m: OnlinePaymentMethod) => ({ ...m, icon: resolveImageUrl(m.icon) }));
                if (data.orderStatusColumns) data.orderStatusColumns = data.orderStatusColumns.map((c: OrderStatusColumn) => ({ ...c, id: String(c.id) }));
                setRestaurantInfo(data);
            } else if (isInitialLoad) throw new Error('Failed to fetch settings');

            if (classificationsRes.ok) {
                const data = await classificationsRes.json();
                setCategories(data.categories || []);
                setTags(data.tags || []);
            }
            if (promotionsRes.ok) {
                const rawPromotions: any[] = (await promotionsRes.json()) || [];
                const processedPromotions = rawPromotions.map((promo) => {
                    if (promo.endDate && typeof promo.endDate === 'string' && !promo.endDate.endsWith('Z')) {
                        return { ...promo, endDate: promo.endDate.replace(' ', 'T') + 'Z' };
                    }
                    return promo;
                });
                setPromotions(processedPromotions);
            }
            if (productsRes.ok) {
                const data = await productsRes.json();
                setProducts((data || []).map((p: Product) => ({ ...p, image: resolveImageUrl(p.image) })));
            }
        } catch (error) {
            console.error("Error fetching public data:", error);
            if (isInitialLoad) setRestaurantInfo(fallbackRestaurantInfo);
            else showToast(t.dataRefreshFailed);
        } finally {
            if (isInitialLoad) setIsLoading(false);
            else { setProgress(100); setTimeout(() => setShowProgress(false), 500); }
        }
    }, [setIsLoading, setShowProgress, setProgress, showToast, t.dataRefreshFailed]);

    useEffect(() => {
        fetchAllData(true);
    }, [fetchAllData]);

    const updateRestaurantInfo = useCallback(async (updatedInfo: Partial<RestaurantInfo>) => {
        if (!restaurantInfo || Object.keys(updatedInfo).length === 0) return;
        setIsProcessing(true);
        try {
            const dbPayload: { [key: string]: any } = {};
            const uiUpdates: Partial<RestaurantInfo> = {};

            const uploadImage = async (file: File, type: 'branding' | 'icons' | 'payment', oldPath?: string): Promise<string | null> => {
                const formData = new FormData();
                formData.append('image', file);
                formData.append('type', type);
                if (oldPath) {
                    const relativeOldPath = oldPath.split('?')[0].replace(new URL(APP_CONFIG.API_BASE_URL).origin + '/', '');
                    formData.append('oldPath', relativeOldPath);
                }

                const uploadRes = await fetch(`${APP_CONFIG.API_BASE_URL}upload_image.php`, { method: 'POST', body: formData });
                if (!uploadRes.ok) throw new Error(`Upload failed: ${await uploadRes.text()}`);
                const result = await uploadRes.json();
                if (result.success && result.url) return result.url;
                throw new Error(result.error || `Failed to get URL from upload`);
            };

            for (const key of Object.keys(updatedInfo) as Array<keyof RestaurantInfo>) {
                const value = updatedInfo[key];

                switch (key) {
                    case 'logo':
                    case 'heroImage':
                        if (typeof value === 'string') {
                            if (value.startsWith('data:image')) {
                                const file = dataUrlToFile(value, `${key}.png`);
                                const oldPath = restaurantInfo[key];
                                const imageUrl = await uploadImage(file, 'branding', oldPath);
                                if (imageUrl) {
                                    dbPayload[key] = imageUrl.split('?v=')[0];
                                    uiUpdates[key] = resolveImageUrl(imageUrl);
                                }
                            } else {
                                dbPayload[key] = value;
                                uiUpdates[key] = value;
                            }
                        }
                        break;
                    case 'socialLinks':
                    case 'onlinePaymentMethods':
                        const originalItems = restaurantInfo[key] as any[];
                        const items = value as any[];
                        const type = key === 'socialLinks' ? 'icons' : 'payment';
                        const processedItems = await Promise.all(
                            items.map(async (item, i) => {
                                if (item.icon && item.icon.startsWith('data:image')) {
                                    const file = dataUrlToFile(item.icon, `${type}_icon_${i}.png`);
                                    const originalItem = item.id ? originalItems.find(orig => orig.id === item.id) : null;
                                    const oldPath = originalItem ? originalItem.icon : undefined;
                                    const uploadResult = await uploadImage(file, type, oldPath);
                                    const relativeUrl = uploadResult ? uploadResult.split('?v=')[0] : item.icon;
                                    return { ...item, icon: relativeUrl };
                                }
                                return item;
                            })
                        );
                        dbPayload[key] = processedItems;
                        (uiUpdates as any)[key] = processedItems.map((item: any) => ({...item, icon: resolveImageUrl(item.icon)}));
                        break;
                    default:
                        (dbPayload as any)[key] = value;
                        (uiUpdates as any)[key] = value;
                        break;
                }
            }
            
            if (Object.keys(dbPayload).length === 0) { setIsProcessing(false); return; }
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_settings.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dbPayload) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || 'Update failed');
            setRestaurantInfo(prev => prev ? { ...prev, ...uiUpdates } : null);
            showToast(t.settingsUpdatedSuccess);
        } catch (error) {
            console.error("Error updating restaurant info:", error);
            showToast(t.settingsUpdateFailed);
        } finally { setIsProcessing(false); }
    }, [restaurantInfo, showToast, t.settingsUpdatedSuccess, t.settingsUpdateFailed, setIsProcessing]);

    const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'rating'>, imageFile?: File | null) => {
        if (!hasPermission('add_product')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            let finalProductData = { ...productData };
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                formData.append('type', 'products');
                const uploadRes = await fetch(`${APP_CONFIG.API_BASE_URL}upload_image.php`, { method: 'POST', body: formData });
                const result = await uploadRes.json();
                if (!uploadRes.ok || !result.success) throw new Error(result.error || 'Image upload failed');
                finalProductData.image = result.url.split('?v=')[0];
            }
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_product.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalProductData) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.productAddFailed);
            const newProduct = { ...result.product, image: resolveImageUrl(result.product.image) };
            setProducts(prev => [newProduct, ...prev].sort((a,b) => a.name[language].localeCompare(b.name[language])));
            showToast(t.productAddedSuccess);
        } catch (error: any) { showToast(error.message || t.productAddFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, t, language, setProducts, showToast, setIsProcessing]);
    
    const updateProduct = useCallback(async (updatedProduct: Product, imageFile?: File | null) => {
        if (!hasPermission('edit_product')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            let finalProductData = { ...updatedProduct };
            let serverImageUrl = '';
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                formData.append('type', 'products');
                const relativeOldPath = updatedProduct.image.split('?')[0].replace(new URL(APP_CONFIG.API_BASE_URL).origin + '/', '');
                formData.append('oldPath', relativeOldPath);
                const uploadRes = await fetch(`${APP_CONFIG.API_BASE_URL}upload_image.php`, { method: 'POST', body: formData });
                const result = await uploadRes.json();
                if (!uploadRes.ok || !result.success) throw new Error(result.error || 'Image upload failed');
                serverImageUrl = result.url;
                finalProductData.image = serverImageUrl.split('?v=')[0];
            } else {
                 const domain = new URL(APP_CONFIG.API_BASE_URL).origin + '/';
                 finalProductData.image = updatedProduct.image ? updatedProduct.image.split('?v=')[0].replace(domain, '') : '';
            }
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_product.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalProductData) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.productUpdateFailed);
            const resolvedImageUrl = serverImageUrl ? resolveImageUrl(serverImageUrl) : resolveImageUrl(finalProductData.image);
            setProducts(prev => prev.map(p => p.id === updatedProduct.id ? { ...updatedProduct, image: resolvedImageUrl } : p));
            showToast(t.productUpdatedSuccess);
        } catch (error: any) { 
            showToast(error.message || t.productUpdateFailed);
            await fetchAllData(); // Revert by refetching
        }
        finally { setIsProcessing(false); }
    }, [hasPermission, t, setProducts, showToast, setIsProcessing, fetchAllData]);

    const deleteProduct = useCallback(async (productId: number) => {
        if (!hasPermission('delete_product') || !window.confirm(t.confirmDelete)) return;
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}delete_product.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: productId }) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.productDeleteFailed);
            setProducts(prev => prev.filter(p => p.id !== productId));
            showToast(t.productDeletedSuccess);
        } catch (error: any) { showToast(error.message || t.productDeleteFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, t, setProducts, setIsProcessing, showToast]);
    
    const addPromotion = useCallback(async (promotionData: Omit<Promotion, 'id'>) => {
        if (!hasPermission('add_promotion')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_promotion.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(promotionData) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.promotionAddFailed);
            setPromotions(prev => [...prev, result.promotion]);
            showToast(t.promotionAddedSuccess);
        } catch (error: any) { showToast(error.message || t.promotionAddFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, t, setPromotions, showToast, setIsProcessing]);

    const updatePromotion = useCallback(async (updatedPromotion: Promotion) => {
        if (!hasPermission('edit_promotion')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_promotion.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(updatedPromotion) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.promotionUpdateFailed);
            setPromotions(prev => prev.map(p => p.id === updatedPromotion.id ? updatedPromotion : p));
            showToast(t.promotionUpdatedSuccess);
        } catch(error: any) {
            showToast(error.message || t.promotionUpdateFailed);
            await fetchAllData(); // Revert
        } finally { setIsProcessing(false); }
    }, [hasPermission, t, setPromotions, showToast, setIsProcessing, fetchAllData]);

    const deletePromotion = useCallback(async (promotionId: number) => {
        if (!hasPermission('delete_promotion') || !window.confirm(t.confirmDeletePromotion)) return;
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}delete_promotion.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: promotionId }) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.promotionDeleteFailed);
            setPromotions(prev => prev.filter(p => p.id !== promotionId));
            showToast(t.promotionDeletedSuccess);
        } catch (error: any) { showToast(error.message || t.promotionDeleteFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, t, setPromotions, showToast, setIsProcessing]);

    const addCategory = useCallback(async (categoryData: Omit<Category, 'id'>) => {
        if (!hasPermission('add_category')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_category.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(categoryData) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.categoryAddFailed);
            await fetchAllData();
            showToast(t.categoryAddedSuccess);
        } catch(error: any) { showToast(error.message || t.categoryAddFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, t, fetchAllData, showToast, setIsProcessing]);
    
    const updateCategory = useCallback(async (categoryData: Category) => {
        if (!hasPermission('edit_category')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_category.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(categoryData) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.categoryUpdateFailed);
            await fetchAllData();
            showToast(t.categoryUpdatedSuccess);
        } catch (error: any) {
            showToast(error.message || t.categoryUpdateFailed);
            await fetchAllData(); // Revert
        } finally { setIsProcessing(false); }
    }, [hasPermission, t, fetchAllData, showToast, setIsProcessing]);

    const updateCategoryOrder = useCallback(async (orderedCategories: Category[]) => {
        if (!hasPermission('edit_category')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const payload: { id: number, display_order: number }[] = [];
            const buildPayload = (cats: Category[]) => cats.forEach((cat, index) => {
                payload.push({ id: cat.id, display_order: index });
                if (cat.children?.length) buildPayload(cat.children);
            });
            buildPayload(orderedCategories);
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_category_order.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.orderSaveFailed);
            await fetchAllData();
            showToast(t.orderSavedSuccess);
        } catch (error: any) {
            showToast(error.message || t.orderSaveFailed);
            await fetchAllData();
        } finally { setIsProcessing(false); }
    }, [hasPermission, t, setIsProcessing, showToast, fetchAllData]);

    const deleteCategory = useCallback(async (categoryId: number) => {
        if (!hasPermission('delete_category') || !window.confirm(t.confirmDeleteCategory)) return;
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}delete_category.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: categoryId }) });
            const result = await response.json();
            if (!response.ok || !result.success) {
                if (result.errorKey && t[result.errorKey as keyof typeof t]) throw new Error(t[result.errorKey as keyof typeof t]);
                throw new Error(result.error || t.categoryDeleteFailed);
            }
            await fetchAllData();
            showToast(t.categoryDeletedSuccess);
        } catch (error: any) { showToast(error.message || t.categoryDeleteFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, t, setIsProcessing, showToast, fetchAllData]);

    const addTag = useCallback(async (tagData: Omit<Tag, 'id'> & { id: string }) => {
        if (!hasPermission('add_tag')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_tag.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(tagData) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.tagAddFailed);
            await fetchAllData();
            showToast(t.tagAddedSuccess);
        } catch (error: any) { showToast(error.message || t.tagAddFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, t, fetchAllData, showToast, setIsProcessing]);
    
    const updateTag = useCallback(async (tagData: Tag) => {
        if (!hasPermission('edit_tag')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_tag.php`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(tagData) });
            if (!response.ok || !(await response.json()).success) throw new Error(t.tagUpdateFailed);
            await fetchAllData();
            showToast(t.tagUpdatedSuccess);
        } catch (error: any) {
            showToast(error.message || t.tagUpdateFailed);
            await fetchAllData();
        } finally { setIsProcessing(false); }
    }, [hasPermission, t, fetchAllData, showToast, setIsProcessing]);

    const deleteTag = useCallback(async (tagId: string) => {
        if (!hasPermission('delete_tag') || !window.confirm(t.confirmDeleteTag)) return;
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}delete_tag.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: tagId }) });
            const result = await response.json();
            if (!response.ok || !result.success) {
                if (result.errorKey && t[result.errorKey as keyof typeof t]) throw new Error(t[result.errorKey as keyof typeof t]);
                throw new Error(result.error || t.tagDeleteFailed);
            }
            await fetchAllData();
            showToast(t.tagDeletedSuccess);
        } catch (error: any) { showToast(error.message || t.tagDeleteFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, t, fetchAllData, setIsProcessing, showToast]);


    const value: DataContextType = {
        restaurantInfo,
        products, setProducts,
        categories, setCategories,
        tags, setTags,
        promotions, setPromotions,
        fetchAllData, updateRestaurantInfo,
        addProduct, updateProduct, deleteProduct,
        addPromotion, updatePromotion, deletePromotion,
        addCategory, updateCategory, updateCategoryOrder, deleteCategory,
        addTag, updateTag, deleteTag
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
