import type { Language } from '../types';
import { APP_CONFIG } from '../utils/config';

// Import English translations
import enAdmin from './locales/en/admin';
import enAuth from './locales/en/auth';
import enCommon from './locales/en/common';
import enMenu from './locales/en/menu';
import enProfile from './locales/en/profile';

// Import Arabic translations
import arAdmin from './locales/ar/admin';
import arAuth from './locales/ar/auth';
import arCommon from './locales/ar/common';
import arMenu from './locales/ar/menu';
import arProfile from './locales/ar/profile';

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