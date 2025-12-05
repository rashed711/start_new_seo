
import type { CartItem, Order, RestaurantInfo, Language, Product, Promotion, Category, PurchaseInvoice, SalesInvoice, SalesInvoiceItem } from '../types';
import { translations } from '../i18n/translations';
import { APP_CONFIG } from './config';

declare const bidi: any;

export const getActivePromotionForProduct = (productId: number, promotions: Promotion[]): Promotion | undefined => {
    const now = new Date();
    return promotions.find(promo => 
        promo.productId === productId && 
        promo.isActive && 
        new Date(promo.endDate) > now
    );
};

export const formatNumber = (num: number): string => {
  try {
    return new Intl.NumberFormat().format(num);
  } catch (e) {
    return String(num);
  }
};

export const calculateOriginalItemUnitPrice = (item: CartItem): number => {
    let itemPrice = item.product.price;
    if (item.options && item.product.options) {
        Object.entries(item.options).forEach(([optionKey, valueKey]) => {
            const option = item.product.options?.find(opt => opt.name.en === optionKey);
            const value = option?.values.find(val => val.name.en === valueKey);
            if (value) {
                itemPrice += value.priceModifier;
            }
        });
    }
    return itemPrice;
};

export const calculateItemUnitPrice = (item: CartItem): number => {
    let itemPrice = calculateOriginalItemUnitPrice(item);
    if (item.appliedDiscountPercent) {
        itemPrice = itemPrice * (1 - item.appliedDiscountPercent / 100);
    }
    return itemPrice;
};

export const calculateOriginalItemTotal = (item: CartItem): number => {
    return calculateOriginalItemUnitPrice(item) * item.quantity;
};


export const calculateItemTotal = (item: CartItem): number => {
    return calculateItemUnitPrice(item) * item.quantity;
};


export const calculateTotal = (cartItems: CartItem[]): number => {
  return cartItems.reduce((total, item) => total + calculateItemTotal(item), 0);
};

export const calculateTotalSavings = (cartItems: CartItem[]): number => {
    const originalTotal = cartItems.reduce((total, item) => total + calculateOriginalItemTotal(item), 0);
    const finalTotal = calculateTotal(cartItems);
    return originalTotal - finalTotal;
};

export const formatDate = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  // Force LTR direction using Unicode Control Characters (\u202A... \u202C)
  return `\u202A${day}/${month}/${year}\u202C`;
};

export const formatDateTime = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Force LTR direction using Unicode Control Characters (\u202A... \u202C)
  // This ensures "15/11/2025 at 09:42 PM" stays in that order even in RTL mode.
  return `\u202A${day}/${month}/${year} at ${time}\u202C`;
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
        const img = new Image();

        const resolveWithPlaceholder = () => {
            const placeholder = new Image(1, 1);
            placeholder.onload = () => resolve(placeholder);
            placeholder.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
        };

        img.onload = () => resolve(img);
        img.onerror = (err) => {
            console.error(`Failed to load image: ${src}`, err);
            resolveWithPlaceholder();
        };

        if (!src) {
            resolveWithPlaceholder();
            return;
        }

        if (!src.startsWith('data:')) {
            img.crossOrigin = 'Anonymous';
        }

        img.src = src;
    });
};

export const resolveImageUrl = (path: string | undefined): string => {
  if (!path || path.startsWith('http') || path.startsWith('data:')) {
    return path || '';
  }
  const domain = new URL(APP_CONFIG.API_BASE_URL).origin;
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${domain}/${cleanPath}`;
};

const getWrappedTextLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    if (!text) return [''];
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
};

export const normalizeArabic = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/أ|إ|آ/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[\u064B-\u0652]/g, '');
};

export const imageUrlToBlob = (imageUrl: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas to Blob conversion failed.'));
                    }
                }, 'image/png');
            } else {
                reject(new Error('Could not get canvas context.'));
            }
        };
        img.onerror = (err) => {
            console.error("Failed to load image for blob conversion:", err);
            reject(new Error('Failed to load image for blob conversion.'));
        };
        img.src = imageUrl;
    });
};

export const generateReceiptImage = async (
  order: Order,
  restaurantInfo: RestaurantInfo,
  t: typeof translations['en'],
  language: Language,
  creatorName?: string
): Promise<string> => {
    await document.fonts.ready;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // --- SETUP ---
    const isRtl = language === 'ar';
    if (isRtl) {
        ctx.direction = 'rtl';
    }
    const FONT_SANS = isRtl ? "'Cairo', sans-serif" : "'Cairo', sans-serif";
    const FONT_BOLD = `bold ${FONT_SANS}`;
    const FONT_MONO = "'Courier New', Courier, monospace";

    const width = 700;
    const padding = 35;
    const contentWidth = width - (padding * 2);
    
    const COLORS = { 
        BG: '#FFFFFF', 
        TEXT_DARK: '#1e293b', 
        TEXT_MEDIUM: '#475569', 
        TEXT_LIGHT: '#94a3b8', 
        BORDER: '#e2e8f0',
        PRIMARY: '#f59e0b',
        SUCCESS: '#16a34a',
        INFO: '#2563eb',
        DANGER: '#dc2626'
    };

    // --- HELPERS ---
    const x = (pos: number) => isRtl ? width - pos : pos;
    const textAlign = (align: 'start' | 'end') => isRtl ? (align === 'start' ? 'right' : 'left') : (align === 'start' ? 'left' : 'right');
    const drawWrappedText = (text: string, xPos: number, yPos: number, maxWidth: number, lineHeight: number, align: 'start' | 'end' = 'start'): number => {
        ctx.textAlign = textAlign(align);
        const lines = getWrappedTextLines(ctx, text, maxWidth);
        lines.forEach((line, index) => {
            ctx.fillText(line, x(xPos), yPos + (index * lineHeight));
        });
        return yPos + (lines.length - 1) * lineHeight;
    };
     const formatReceiptDateTime = (isoString: string): string => {
        const date = new Date(isoString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? (language === 'ar' ? 'م' : 'PM') : (language === 'ar' ? 'ص' : 'AM');
        hours = hours % 12;
        hours = hours ? hours : 12;
        const hoursStr = String(hours).padStart(2, '0');
        
        const atText = t.atTime || (language === 'ar' ? 'الساعة' : 'at');
        
        return `${day}/${month}/${year} ${atText} ${hoursStr}:${minutes} ${ampm}`;
    };
    
    // --- HEIGHT CALCULATION ---
    let totalHeight = 0;
    
    totalHeight += 180; // Header
    totalHeight += 50; // Order Info
    
    ctx.font = `14px ${FONT_SANS}`;
    const addressText = order.customer.address || '';
    const addressForCanvas = isRtl && typeof bidi !== 'undefined' ? bidi.getVisual(addressText, 'RTL') : addressText;
    const addressLines = getWrappedTextLines(ctx, addressForCanvas, contentWidth / 2 - 20);
    totalHeight += 80 + (addressLines.length > 1 ? (addressLines.length - 1) * 20 : 0);
    
    totalHeight += 60; // Items Header

    order.items.forEach(item => {
        totalHeight += 20; // top padding
        ctx.font = `bold 16px ${FONT_SANS}`;
        const productName = isRtl && typeof bidi !== 'undefined' ? bidi.getVisual(item.product.name[language], 'RTL') : item.product.name[language];
        const nameLines = getWrappedTextLines(ctx, productName, contentWidth - 250);
        totalHeight += nameLines.length * 22;

        if (item.options) {
            ctx.font = `14px ${FONT_SANS}`;
            const optionsText = Object.entries(item.options).map(([optKey, valKey]) => {
                const option = item.product.options?.find(o => o.name.en === optKey);
                const value = option?.values.find(v => v.name.en === valKey);
                return value ? `+ ${value.name[language]}` : '';
            }).filter(Boolean).join(', ');
            const optionsForCanvas = isRtl && typeof bidi !== 'undefined' ? bidi.getVisual(optionsText, 'RTL') : optionsText;
            const optionLines = getWrappedTextLines(ctx, optionsForCanvas, contentWidth - 250);
            totalHeight += optionLines.length * 18;
        }
        totalHeight += 20; // bottom padding
    });
    
    const totalSavings = calculateTotalSavings(order.items);
    totalHeight += 40; // top padding and line
    if (totalSavings > 0) totalHeight += 28 * 2;
    totalHeight += 36; // Grand Total
    
    totalHeight += 60; // Payment
    totalHeight += 80; // Footer

    // --- DRAWING ---
    canvas.width = width;
    canvas.height = totalHeight;
    let y = 0;

    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, width, totalHeight);
    
    // Header
    y = 50;
    const logo = await loadImage(restaurantInfo.logo);
    ctx.drawImage(logo, (width / 2) - 40, y, 80, 80);
    y += 100;

    ctx.font = `bold 32px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.TEXT_DARK;
    ctx.textAlign = 'center';
    const restaurantNameForCanvas = isRtl && typeof bidi !== 'undefined' ? bidi.getVisual(restaurantInfo.name[language], 'RTL') : restaurantInfo.name[language];
    ctx.fillText(restaurantNameForCanvas, width / 2, y);
    y += 30;
    
    // Order Info Section
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = COLORS.BORDER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(padding, y, contentWidth, 120 + (addressLines.length > 1 ? (addressLines.length - 1) * 20 : 0), 12);
    ctx.fill();
    ctx.stroke();
    y += 30;
    
    ctx.font = `14px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.TEXT_MEDIUM;
    ctx.textAlign = textAlign('start');
    ctx.fillText(`${t.orderId}:`, x(padding + 20), y);
    ctx.font = `bold 14px ${FONT_MONO}`;
    ctx.fillStyle = COLORS.TEXT_DARK;
    ctx.fillText(`${order.id}`, x(padding + 100), y);

    ctx.font = `14px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.TEXT_MEDIUM;
    ctx.textAlign = textAlign('end');
    ctx.fillText(`${t.date}: ${formatReceiptDateTime(order.timestamp)}`, x(width - padding - 20), y);
    y += 35;

    const col1X = padding + 20;
    const col2X = width / 2 + 10;
    
    ctx.font = `bold 14px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.TEXT_DARK;
    ctx.textAlign = textAlign('start');
    ctx.fillText(language === 'ar' ? 'بيانات العميل:' : 'Billed To:', x(col1X), y);
    
    ctx.font = `14px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.TEXT_MEDIUM;
    y += 24;
    const customerNameForCanvas = isRtl && typeof bidi !== 'undefined' ? bidi.getVisual(order.customer.name || 'Guest', 'RTL') : (order.customer.name || 'Guest');
    ctx.fillText(customerNameForCanvas, x(col1X), y);
    y += 20;
    ctx.fillText(order.customer.mobile, x(col1X), y);
    if(order.customer.address) {
        y += 20;
        drawWrappedText(addressForCanvas, col1X, y, contentWidth / 2 - 40, 20, 'start');
    }

    y = 265;
    ctx.font = `bold 14px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.TEXT_DARK;
    ctx.textAlign = textAlign('start');
    ctx.fillText(language === 'ar' ? 'تفاصيل الطلب:' : 'Order Details:', x(col2X), y);
    
    ctx.font = `14px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.TEXT_MEDIUM;
    y += 24;
    ctx.fillText(`${t.orderType}: ${t[order.orderType.toLowerCase() as keyof typeof t] || order.orderType}`, x(col2X), y);
    if (order.tableNumber) {
        y += 20;
        ctx.fillText(`${t.table}: ${order.tableNumber}`, x(col2X), y);
    }
    if (creatorName) {
        y += 20;
        const creatorNameForCanvas = isRtl && typeof bidi !== 'undefined' ? bidi.getVisual(creatorName, 'RTL') : creatorName;
        ctx.fillText(`${t.createdBy}: ${creatorNameForCanvas}`, x(col2X), y);
    }
    y += 60 + (addressLines.length > 1 ? (addressLines.length - 1) * 20 : 0);

    // Items Table Header
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(padding, y, contentWidth, 40);
    y += 28;

    ctx.font = `bold 13px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.TEXT_MEDIUM;
    
    const qtyX = width - padding - 280;
    const priceX = width - padding - 180;
    const totalX = width - padding - 35;

    ctx.textAlign = textAlign('start');
    ctx.fillText(t.item, x(padding + 15), y);
    
    ctx.textAlign = 'center';
    ctx.fillText(t.quantity, x(qtyX), y);
    ctx.fillText(t.price, x(priceX), y);
    
    ctx.textAlign = textAlign('end');
    ctx.fillText(t.total, x(totalX), y);
    y += 12;

    // Items
    order.items.forEach(item => {
        y += 20;
        const itemStartY = y;

        const finalItemTotal = calculateItemTotal(item);
        
        ctx.textAlign = 'center';
        ctx.font = `16px ${FONT_SANS}`;
        ctx.fillStyle = COLORS.TEXT_DARK;
        ctx.fillText(String(item.quantity), x(qtyX), itemStartY + 5);
        
        ctx.font = `14px ${FONT_MONO}`;
        if (item.appliedDiscountPercent) {
            ctx.fillText(calculateItemUnitPrice(item).toFixed(2), x(priceX), itemStartY + 5);
            ctx.fillStyle = COLORS.TEXT_LIGHT;
            const originalPriceText = calculateOriginalItemUnitPrice(item).toFixed(2);
            ctx.fillText(originalPriceText, x(priceX), itemStartY + 25);
            const textWidth = ctx.measureText(originalPriceText).width;
            ctx.strokeStyle = COLORS.TEXT_LIGHT;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x(priceX) - (isRtl ? 0 : textWidth / 2), itemStartY + 20);
            ctx.lineTo(x(priceX) + (isRtl ? textWidth : textWidth / 2), itemStartY + 20);
            ctx.stroke();
        } else {
            ctx.fillText(calculateItemUnitPrice(item).toFixed(2), x(priceX), itemStartY + 5);
        }
        
        ctx.textAlign = textAlign('end');
        ctx.font = `bold 16px ${FONT_SANS}`;
        ctx.fillStyle = COLORS.TEXT_DARK;
        ctx.fillText(finalItemTotal.toFixed(2), x(totalX), itemStartY + 5);

        ctx.font = `bold 16px ${FONT_SANS}`;
        const productNameForCanvas = isRtl && typeof bidi !== 'undefined' ? bidi.getVisual(item.product.name[language], 'RTL') : item.product.name[language];
        const nameEndY = drawWrappedText(productNameForCanvas, padding + 15, itemStartY, contentWidth - 350, 22, 'start');
        
        let currentY = nameEndY;
        if (item.options) {
            currentY += 18;
            ctx.font = `14px ${FONT_SANS}`;
            ctx.fillStyle = COLORS.TEXT_MEDIUM;
            const optionsText = Object.entries(item.options).map(([optKey, valKey]) => {
                const option = item.product.options?.find(o => o.name.en === optKey);
                const value = option?.values.find(v => v.name.en === valKey);
                return value ? `+ ${value.name[language]}` : '';
            }).filter(Boolean).join(', ');
            const optionsTextForCanvas = isRtl && typeof bidi !== 'undefined' ? bidi.getVisual(optionsText, 'RTL') : optionsText;
            currentY = drawWrappedText(optionsTextForCanvas, padding + 15, currentY, contentWidth - 350, 18, 'start');
        }
        
        y = Math.max(y, currentY) + 20;

        ctx.strokeStyle = COLORS.BORDER;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    });

    // Totals section
    y += 30;
    const totalsX = width - padding - 200;
    const valuesX = width - padding;

    if (totalSavings > 0) {
        const originalTotal = order.total + totalSavings;
        ctx.font = `16px ${FONT_SANS}`;
        ctx.fillStyle = COLORS.TEXT_MEDIUM;
        ctx.textAlign = textAlign('start');
        ctx.fillText(`${t.subtotal}:`, x(totalsX), y);
        ctx.textAlign = textAlign('end');
        ctx.font = `16px ${FONT_MONO}`;
        ctx.fillText(originalTotal.toFixed(2), x(valuesX), y);
        y += 28;
        
        ctx.font = `16px ${FONT_SANS}`;
        ctx.fillStyle = COLORS.DANGER;
        ctx.textAlign = textAlign('start');
        ctx.fillText(`${t.discount}:`, x(totalsX), y);
        ctx.textAlign = textAlign('end');
        ctx.font = `16px ${FONT_MONO}`;
        ctx.fillText(`-${totalSavings.toFixed(2)}`, x(valuesX), y);
        y += 28;
    }

    ctx.font = `bold 20px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.TEXT_DARK;
    ctx.textAlign = textAlign('start');
    ctx.fillText(`${t.total}:`, x(totalsX), y);
    ctx.font = `bold 24px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.PRIMARY;
    ctx.textAlign = textAlign('end');
    ctx.fillText(`${order.total.toFixed(2)} ${t.currency}`, x(valuesX), y);
    y += 40;

    const paymentStatusText = order.paymentMethod === 'online' ? t.paymentStatusPaidOnline : order.paymentMethod === 'cod' ? t.paymentStatusCod : t.paymentStatusUnpaid;
    const paymentStatusColor = order.paymentMethod === 'online' ? COLORS.SUCCESS : order.paymentMethod === 'cod' ? COLORS.INFO : COLORS.DANGER;

    ctx.font = `14px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.TEXT_MEDIUM;
    ctx.textAlign = textAlign('start');
    ctx.fillText(t.paymentMethod, x(padding), y);
    ctx.fillStyle = paymentStatusColor;
    ctx.textAlign = textAlign('end');
    ctx.fillText(paymentStatusText, x(width - padding), y);
    y += 40;
    
    ctx.font = `16px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.TEXT_MEDIUM;
    ctx.textAlign = 'center';
    ctx.fillText(t.thankYouForOrder, width / 2, y);

    return canvas.toDataURL('image/png');
};


const generateGenericInvoiceImage = async (
  invoice: PurchaseInvoice | SalesInvoice,
  type: 'purchase' | 'sales',
  restaurantInfo: RestaurantInfo,
  t: typeof translations['en'],
  language: Language,
  products?: Product[]
): Promise<string> => {
    await document.fonts.ready;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const isRtl = language === 'ar';
    if (isRtl) {
        ctx.direction = 'rtl';
    }
    const FONT_SANS = isRtl ? 'Cairo, sans-serif' : 'sans-serif';
    const FONT_MONO = 'monospace';
    
    const width = 500;
    const padding = 25;
    const contentWidth = width - (padding * 2);
    
    const COLORS = { 
        PAPER: '#FFFFFF', 
        TEXT_DARK: '#111827', 
        TEXT_MEDIUM: '#4B5563', 
        TEXT_LIGHT: '#9CA3AF', 
        BORDER: '#E5E7EB', 
        RED: '#EF4444',
        PRIMARY: '#F59E0B'
    };

    // --- HEIGHT CALCULATION ---
    let y = 0;
    y += 160; 

    const details = [];
    if (type === 'sales') {
        const si = invoice as SalesInvoice;
        details.push({ label: t.invoiceNumber, value: si.invoice_number });
        details.push({ label: t.date, value: formatDateTime(si.invoice_date) });
        const customerName = isRtl && typeof bidi !== 'undefined' ? bidi.getVisual(si.customer_name, 'RTL') : si.customer_name;
        details.push({ label: t.customer, value: customerName });
        details.push({ label: t.mobileNumber, value: si.customer_mobile });
        if (si.created_by_name) {
            const creatorName = isRtl && typeof bidi !== 'undefined' ? bidi.getVisual(si.created_by_name, 'RTL') : si.created_by_name;
            details.push({ label: t.createdBy, value: creatorName });
        }
    } else {
        const pi = invoice as PurchaseInvoice;
        details.push({ label: t.invoiceId, value: String(pi.id) });
        details.push({ label: t.date, value: formatDateTime(pi.invoice_date) });
        const supplierName = isRtl && typeof bidi !== 'undefined' ? bidi.getVisual(pi.supplier_name, 'RTL') : pi.supplier_name;
        details.push({ label: t.supplier, value: supplierName });
    }
    y += details.length * 24;
    y += 25;

    y += 60; 

    (invoice.items as SalesInvoiceItem[]).forEach((item: SalesInvoiceItem) => {
        const productNameText = item.product_name?.[language] || `Product ID: ${item.product_id}`;
        const productName = isRtl && typeof bidi !== 'undefined' ? bidi.getVisual(productNameText, 'RTL') : productNameText;
        ctx.font = `14px ${FONT_SANS}`;
        const lines = getWrappedTextLines(ctx, productName, 200);
        let itemHeight = lines.length * 18;
        
        if (type === 'sales' && (item.discount_percent || 0) > 0) {
            itemHeight += 16;
        }
        y += Math.max(itemHeight, 18);
        y += 25;
    });
    
    y += 20;
    let totalSavings = 0;
    if (type === 'sales') {
        const salesInvoice = invoice as SalesInvoice;
        const originalTotal = salesInvoice.items.reduce((sum, item) => {
            const originalPrice = item.original_price ?? item.price;
            return sum + (originalPrice * item.quantity);
        }, 0);
        totalSavings = originalTotal - salesInvoice.total_amount;
    }
    if (totalSavings > 0.01) {
        y += 28 * 2;
    }
    y += 36;
    y += 20;

    y += 40;

    // --- DRAWING ---
    canvas.width = width;
    canvas.height = y;
    const finalHeight = y;
    y = 0;

    ctx.fillStyle = COLORS.PAPER;
    ctx.fillRect(0, 0, width, finalHeight);

    y = 40;
    const logo = await loadImage(restaurantInfo.logo);
    ctx.drawImage(logo, (width / 2) - 30, y, 60, 60);
    y += 70;
    ctx.font = `bold 22px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.TEXT_DARK;
    ctx.textAlign = 'center';
    const restaurantNameForCanvas = isRtl && typeof bidi !== 'undefined' ? bidi.getVisual(restaurantInfo.name[language], 'RTL') : restaurantInfo.name[language];
    ctx.fillText(restaurantNameForCanvas, width / 2, y);
    y += 20;
    ctx.font = `16px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.TEXT_MEDIUM;
    const invoiceTitle = type === 'sales' ? t.salesInvoice : t.purchaseInvoice;
    ctx.fillText(invoiceTitle, width / 2, y);
    y += 30;
    
    ctx.font = `14px ${FONT_SANS}`;
    details.forEach(detail => {
        ctx.fillStyle = COLORS.TEXT_MEDIUM;
        ctx.textAlign = isRtl ? 'right' : 'left';
        ctx.fillText(detail.label, isRtl ? width - padding : padding, y);
        
        ctx.fillStyle = COLORS.TEXT_DARK;
        ctx.textAlign = isRtl ? 'left' : 'right';
        ctx.fillText(detail.value, isRtl ? padding : width - padding, y);
        y += 24;
    });
    y += 10;
    
    const headerY = y;
    const headerHeight = 50;
    ctx.fillStyle = COLORS.TEXT_DARK;
    ctx.fillRect(padding, headerY, contentWidth, headerHeight);

    ctx.font = `bold 13px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.PAPER;

    const drawHeaderText = (text: string, x: number, align: CanvasTextAlign) => {
        ctx.textAlign = align;
        const words = text.split(' ');
        if (words.length > 1) {
            const line1 = words[0];
            const line2 = words.slice(1).join(' ');
            ctx.fillText(line1, x, headerY + 20);
            ctx.fillText(line2, x, headerY + 38);
        } else {
            ctx.fillText(text, x, headerY + 30);
        }
    };

    const subtotalColWidth = 85;
    const priceColWidth = 85;
    const qtyColWidth = 50;
    const itemColWidth = contentWidth - subtotalColWidth - priceColWidth - qtyColWidth;
    const colPadding = 10;

    const priceHeader = type === 'sales' ? t.salePrice : t.purchasePrice;
    if (isRtl) {
        drawHeaderText(t.item, width - padding - colPadding, 'right');
        drawHeaderText(t.quantity, width - padding - itemColWidth - (qtyColWidth / 2), 'center');
        drawHeaderText(priceHeader, width - padding - itemColWidth - qtyColWidth - (priceColWidth / 2), 'center');
        drawHeaderText(t.subtotal, padding + colPadding, 'left');
    } else {
        drawHeaderText(t.item, padding + colPadding, 'left');
        drawHeaderText(t.quantity, padding + itemColWidth + (qtyColWidth / 2), 'center');
        drawHeaderText(priceHeader, padding + itemColWidth + qtyColWidth + (priceColWidth / 2), 'center');
        drawHeaderText(t.subtotal, width - padding - colPadding, 'right');
    }

    y = headerY + headerHeight;
    y += 20;

    (invoice.items as SalesInvoiceItem[]).forEach((item: SalesInvoiceItem) => {
        const itemStartY = y;

        const price = item.price ?? 0;
        const subtotal = item.subtotal;

        ctx.font = `14px ${FONT_MONO}`;
        ctx.fillStyle = COLORS.TEXT_MEDIUM;
        
        if (isRtl) {
            const qtyX = width - padding - itemColWidth - (qtyColWidth / 2);
            const priceX = qtyX - (qtyColWidth / 2) - (priceColWidth / 2);

            ctx.textAlign = 'center';
            ctx.fillText(String(item.quantity), qtyX, y);
            ctx.fillText(Number(price).toFixed(2), priceX, y);
            
            ctx.textAlign = 'left';
            ctx.font = `bold 14px ${FONT_MONO}`;
            ctx.fillStyle = COLORS.TEXT_DARK;
            ctx.fillText(Number(subtotal).toFixed(2), padding + colPadding, y);
        } else {
            const qtyX = padding + itemColWidth + (qtyColWidth / 2);
            const priceX = qtyX + (qtyColWidth / 2) + (priceColWidth / 2);

            ctx.textAlign = 'center';
            ctx.fillText(String(item.quantity), qtyX, y);
            ctx.fillText(Number(price).toFixed(2), priceX, y);

            ctx.font = `bold 14px ${FONT_MONO}`;
            ctx.fillStyle = COLORS.TEXT_DARK;
            ctx.textAlign = 'right';
            ctx.fillText(Number(subtotal).toFixed(2), width - padding - colPadding, y);
        }

        const productNameText = item.product_name?.[language] || `Product ID: ${item.product_id}`;
        const productNameForCanvas = isRtl && typeof bidi !== 'undefined' ? bidi.getVisual(productNameText, 'RTL') : productNameText;
        ctx.font = `14px ${FONT_SANS}`;
        ctx.fillStyle = COLORS.TEXT_DARK;
        ctx.textAlign = isRtl ? 'right' : 'left';
        const lines = getWrappedTextLines(ctx, productNameForCanvas, itemColWidth - (colPadding * 2));
        let lineY = y;
        lines.forEach(line => {
            ctx.fillText(line, isRtl ? width - padding - colPadding : padding + colPadding, lineY);
            lineY += 18;
        });
        const itemNameHeight = (lines.length * 18);
        
        let itemHeight = itemNameHeight;

        if (type === 'sales' && (item.discount_percent || 0) > 0) {
            const currentY = itemStartY + Math.max(itemNameHeight - 18, 0) + 16;
            itemHeight = Math.max(itemHeight, currentY - itemStartY + 16);
            ctx.font = `12px ${FONT_SANS}`;
            ctx.fillStyle = COLORS.RED;
            ctx.textAlign = isRtl ? 'right' : 'left';
            ctx.fillText(`(${item.discount_percent?.toFixed(0)}% ${t.discount})`, isRtl ? width - padding - colPadding : padding + colPadding, currentY);
        }
        
        y = itemStartY + Math.max(itemHeight, 18);

        y += 10;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.strokeStyle = COLORS.BORDER;
        ctx.lineWidth = 1;
        ctx.stroke();
        y += 10;
    });

    y += 10;
    
    if (totalSavings > 0.01) {
        const originalTotal = invoice.total_amount + totalSavings;
        ctx.font = `15px ${FONT_SANS}`;
        ctx.fillStyle = COLORS.TEXT_MEDIUM;
        ctx.textAlign = isRtl ? 'right' : 'left';
        ctx.fillText(t.subtotal, isRtl ? width - padding : padding, y);
        ctx.textAlign = isRtl ? 'left' : 'right';
        ctx.fillText(`${originalTotal.toFixed(2)} ${t.currency}`, isRtl ? padding : width - padding, y);
        y += 28;

        ctx.font = `15px ${FONT_SANS}`;
        ctx.fillStyle = COLORS.RED;
        ctx.textAlign = isRtl ? 'right' : 'left';
        ctx.fillText(t.discount, isRtl ? width - padding : padding, y);
        ctx.textAlign = isRtl ? 'left' : 'right';
        ctx.fillText(`-${totalSavings.toFixed(2)} ${t.currency}`, isRtl ? padding : width - padding, y);
        y += 28;
    }
    
    ctx.font = `bold 18px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.TEXT_DARK;
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(t.total, isRtl ? width - padding : padding, y);
    ctx.textAlign = isRtl ? 'left' : 'right';
    ctx.font = `bold 22px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.PRIMARY;
    ctx.fillText(`${invoice.total_amount.toFixed(2)} ${t.currency}`, isRtl ? padding : width - padding, y);
    y += 40;

    ctx.font = `14px ${FONT_SANS}`;
    ctx.fillStyle = COLORS.TEXT_MEDIUM;
    ctx.textAlign = 'center';
    ctx.fillText(language === 'ar' ? 'شكراً لتعاملكم معنا!' : 'Thank you for your business!', width / 2, y);

    return canvas.toDataURL('image/png');
};


export const generatePurchaseInvoiceImage = (invoice: PurchaseInvoice, restaurantInfo: RestaurantInfo, t: typeof translations['en'], language: Language) => 
    generateGenericInvoiceImage(invoice, 'purchase', restaurantInfo, t, language);

export const generateSalesInvoiceImage = (invoice: SalesInvoice, restaurantInfo: RestaurantInfo, t: typeof translations['en'], language: Language, products: Product[], promotions: Promotion[]) =>
    generateGenericInvoiceImage(invoice, 'sales', restaurantInfo, t, language, products);


export const getStartAndEndDates = (dateRange: string, customStart?: string, customEnd?: string): { startDate: Date, endDate: Date } => {
    const now = new Date();
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    switch (dateRange) {
        case 'today':
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            return { startDate: todayStart, endDate: todayEnd };
        case 'yesterday':
            const yesterdayStart = new Date();
            yesterdayStart.setDate(now.getDate() - 1);
            yesterdayStart.setHours(0, 0, 0, 0);
            const yesterdayEnd = new Date(yesterdayStart);
            yesterdayEnd.setHours(23, 59, 59, 999);
            return { startDate: yesterdayStart, endDate: yesterdayEnd };
        case 'week':
            const startOfWeek = new Date();
            startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Assuming week starts on Monday
            startOfWeek.setHours(0, 0, 0, 0);
            return { startDate: startOfWeek, endDate: todayEnd };
        case 'last7days':
            const last7Start = new Date();
            last7Start.setDate(now.getDate() - 6);
            last7Start.setHours(0, 0, 0, 0);
            return { startDate: last7Start, endDate: todayEnd };
        case 'thisMonth':
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return { startDate: thisMonthStart, endDate: todayEnd };
        case 'last30days':
             const last30Start = new Date();
            last30Start.setDate(now.getDate() - 29);
            last30Start.setHours(0, 0, 0, 0);
            return { startDate: last30Start, endDate: todayEnd };
        case 'custom':
            const customStartDateObj = customStart ? new Date(customStart) : new Date(0);
            if (customStart) customStartDateObj.setHours(0, 0, 0, 0);
            const customEndDateObj = customEnd ? new Date(customEnd) : new Date();
            if (customEnd) customEndDateObj.setHours(23, 59, 59, 999);
            return { startDate: customStartDateObj, endDate: customEndDateObj };
        default:
             const defaultStart = new Date();
            defaultStart.setHours(0,0,0,0);
            return { startDate: defaultStart, endDate: todayEnd };
    }
}

export const getDescendantCategoryIds = (categoryId: number, categories: Category[]): number[] => {
    const ids: number[] = [];

    const findCategory = (cats: Category[], id: number): Category | null => {
        for (const cat of cats) {
            if (cat.id === id) {
                return cat;
            }
            if (cat.children) {
                const foundInChildren = findCategory(cat.children, id);
                if (foundInChildren) {
                    return foundInChildren;
                }
            }
        }
        return null;
    };

    const collectAllIds = (category: Category) => {
        ids.push(category.id);
        if (category.children) {
            for (const child of category.children) {
                collectAllIds(child);
            }
        }
    };

    const startCategory = findCategory(categories, categoryId);

    if (startCategory) {
        collectAllIds(startCategory);
    }
    
    return ids;
};
