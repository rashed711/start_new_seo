import type { Language } from '../types';
import { APP_CONFIG } from '../utils/config';

// Import English translations from .ts files
import enAdmin from './locales/en/admin.ts';
import enAuth from './locales/en/auth.ts';
import enCommon from './locales/en/common.ts';
import enMenu from './locales/en/menu.ts';
import enProfile from './locales/en/profile.ts';

// Import Arabic translations from .ts files
import arAdmin from './locales/ar/admin.ts';
import arAuth from './locales/ar/auth.ts';
import arCommon from './locales/ar/common.ts';
import arMenu from './locales/ar/menu.ts';
import arProfile from './locales/ar/profile.ts';

export const translations = {
  en: {
    // Spread the imported modules
    ...enCommon,
    ...enMenu,
    ...enAuth,
    ...enProfile,
    ...enAdmin,
    
    // Keep dynamic values here if any
    restaurantName: APP_CONFIG.APP_NAME.en,
  },
  ar: {
    // Spread the imported modules
    ...arCommon,
    ...arMenu,
    ...arAuth,
    ...arProfile,
    ...arAdmin,

    // Keep dynamic values here if any
    restaurantName: APP_CONFIG.APP_NAME.ar,
  }
};
