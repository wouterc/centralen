import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { API_BASE_URL } from './config';
import dayjs from 'dayjs';
import 'dayjs/locale/da';
import 'dayjs/locale/en';
import 'dayjs/locale/nl';
import 'dayjs/locale/fr';
import 'dayjs/locale/de';

const fetchTranslations = async (lng: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/translations/?lang=${lng}`);
        if (!response.ok) throw new Error('Failed to fetch translations');
        return await response.json();
    } catch (error) {
        console.error('Translation fetch error:', error);
        return {};
    }
};


i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        debug: false,
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
        react: {
            useSuspense: false,
        },
    });

// Initial load
const loadInitialTranslations = async () => {
    const lng = i18n.language || 'en';
    const dayjsLng = lng ? lng.split('-')[0].toLowerCase() : 'en';
    dayjs.locale(dayjsLng);
    const translations = await fetchTranslations(lng);
    i18n.addResourceBundle(lng, 'translation', translations, true, true);
};

loadInitialTranslations();

i18n.on('languageChanged', async (lng) => {
    const dayjsLng = lng ? lng.split('-')[0].toLowerCase() : 'en';
    dayjs.locale(dayjsLng);
    const translations = await fetchTranslations(lng);
    i18n.addResourceBundle(lng, 'translation', translations, true, true);
});

export default i18n;
