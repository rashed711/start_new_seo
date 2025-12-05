import { useState, useEffect } from 'react';
import type { Language } from '../types';

const intervals = [
  { label: 'year', seconds: 31536000 },
  { label: 'month', seconds: 2592000 },
  { label: 'day', seconds: 86400 },
  { label: 'hour', seconds: 3600 },
  { label: 'minute', seconds: 60 },
  { label: 'second', seconds: 1 }
];

export const useTimeAgo = (isoString: string, language: Language) => {
    const [timeAgo, setTimeAgo] = useState('');

    useEffect(() => {
        const calculateTimeAgo = () => {
            if (!isoString) {
                setTimeAgo('');
                return;
            }
            const date = new Date(isoString);
            const seconds = Math.round((Date.now() - date.getTime()) / 1000);
            
            if (seconds < 5) {
                setTimeAgo(language === 'ar' ? 'الآن' : 'just now');
                return;
            }

            const interval = intervals.find(i => seconds >= i.seconds);
            if (interval) {
                const count = Math.floor(seconds / interval.seconds);
                if (language === 'ar') {
                    const formatArabic = () => {
                        const num = count;
                        const label = interval.label;
                        if (label === 'second') return num === 1 ? 'ثانية' : num === 2 ? 'ثانيتين' : num <= 10 ? 'ثوان' : 'ثانية';
                        if (label === 'minute') return num === 1 ? 'دقيقة' : num === 2 ? 'دقيقتين' : num <= 10 ? 'دقائق' : 'دقيقة';
                        if (label === 'hour') return num === 1 ? 'ساعة' : num === 2 ? 'ساعتين' : num <= 10 ? 'ساعات' : 'ساعة';
                        if (label === 'day') return num === 1 ? 'يوم' : num === 2 ? 'يومين' : num <= 10 ? 'أيام' : 'يوم';
                        if (label === 'month') return num === 1 ? 'شهر' : num === 2 ? 'شهرين' : num <= 10 ? 'أشهر' : 'شهر';
                        if (label === 'year') return num === 1 ? 'سنة' : num === 2 ? 'سنتين' : num <= 10 ? 'سنوات' : 'سنة';
                        return '';
                    }
                    setTimeAgo(`منذ ${count} ${formatArabic()}`);
                } else {
                    setTimeAgo(`${count} ${interval.label}${count !== 1 ? 's' : ''} ago`);
                }
            } else {
                 setTimeAgo(language === 'ar' ? 'الآن' : 'just now');
            }
        };

        calculateTimeAgo();
        const timer = setInterval(calculateTimeAgo, 30000); // update every 30 seconds
        return () => clearInterval(timer);
    }, [isoString, language]);

    return timeAgo;
};
