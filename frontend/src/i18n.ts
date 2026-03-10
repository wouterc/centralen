import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { API_BASE_URL } from './config';

const fetchTranslations = async (lng: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/translations/?lang=${lng}`);
        if (!response.ok) throw new Error('Failed to fetch translations');
        return await response.json();
    } catch (error) {
        console.error('Translation fetch error:', error);
        return {};
    }
};

const backendLoader = {
    type: 'backend',
    async read(language: string, namespace: string, callback: (err: any, data: any) => void) {
        try {
            const data = await fetchTranslations(language);
            callback(null, data);
        } catch (err) {
            callback(err, null);
        }
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
    const lng = i18n.language || 'da';
    const translations = await fetchTranslations(lng);
    i18n.addResourceBundle(lng, 'translation', translations, true, true);
};

loadInitialTranslations();

export default i18n;
