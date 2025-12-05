
import type { Product, Category, Tag, Promotion, RestaurantInfo, User } from '../types';
import { APP_CONFIG } from '../utils/config';

export const restaurantInfo: RestaurantInfo = {
    name: APP_CONFIG.APP_NAME,
    logo: "",
    heroImage: "",
    heroTitle: { en: "Welcome", ar: "أهلاً بك" },
    description: { en: "Our Site is being updated. Please check back soon.", ar: "هذا الموقع قيد التحديث. يرجى المراجعة قريبا." },
    whatsappNumber: "",
    tableCount: 0,
    defaultPage: 'menu',
    activationEndDate: null,
    deactivationMessage: {
        en: "The system is temporarily deactivated. Please contact support for more information.",
        ar: "تم إيقاف النظام مؤقتًا. يرجى التواصل مع الدعم الفني لمزيد من المعلومات."
    },
    socialLinks: [],
    orderStatusColumns: [
        { id: 'pending', name: { en: 'New Orders', ar: 'طلبات جديدة' }, color: 'yellow', playSound: true },
        { id: 'in_progress', name: { en: 'In the Kitchen', ar: 'في المطبخ' }, color: 'orange', playSound: true },
        { id: 'ready_for_pickup', name: { en: 'Ready for Pickup', ar: 'جاهز للتسليم' }, color: 'cyan', playSound: false },
        { id: 'out_for_delivery', name: { en: 'Out for Delivery', ar: 'قيد التوصيل' }, color: 'blue', playSound: false },
        { id: 'completed', name: { en: 'Completed', ar: 'مكتمل' }, color: 'green', playSound: false },
        { id: 'cancelled', name: { en: 'Cancelled & Refused', ar: 'ملغي ومرفوض' }, color: 'slate', playSound: false },
    ],
    onlinePaymentMethods: [],
    isPaymobVisible: true,
    codNotes: { en: '', ar: '' },
    onlinePaymentNotes: { en: '', ar: '' },
};

export const initialCategories: Category[] = [];

export const initialTags: Tag[] = [];

export const products: Product[] = [];

export const promotions: Promotion[] = [];