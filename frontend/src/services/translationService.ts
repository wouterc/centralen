import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Custom hook for translations
 * Usage: const { t } = useTranslation();
 * {t('key', 'Default Text')}
 */
export function useTranslation() {
    const { t: i18nT, i18n } = useI18nTranslation();

    const t = (key: string, defaultValueOrOptions?: string | any, options?: any) => {
        if (typeof defaultValueOrOptions === 'string') {
            return i18nT(key, { defaultValue: defaultValueOrOptions, ...options }) as string;
        }
        return i18nT(key, defaultValueOrOptions) as string;
    };

    return { t, i18n, language: i18n.language };
}
