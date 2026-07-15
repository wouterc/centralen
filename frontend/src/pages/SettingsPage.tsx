import React, { useState, useEffect } from 'react';
import { useAppState } from '../StateContext';
import { api } from '../api';
import {
    Settings,
    Save,
    Check,
    X,
    UserCircle,
    Key,
    Globe,
    Loader2,
    ChevronDown,
    Search
} from 'lucide-react';
import Modal from '../components/Modal';
import { useTranslation } from '../services/translationService';

const languages = [
    { code: 'da', label: 'Dansk', flag: '🇩🇰' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

const SettingsPage: React.FC = () => {
    const { state, refreshCurrentUser } = useAppState();
    const { t, i18n } = useTranslation();
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

    // Profile states
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [language, setLanguage] = useState(i18n.language || 'da');
    const [showLangModal, setShowLangModal] = useState(false);
    const [langSearch, setLangSearch] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    // Security states
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityLoading, setSecurityLoading] = useState(false);
    const [securitySuccess, setSecuritySuccess] = useState(false);
    const [securityError, setSecurityError] = useState<string | null>(null);

    const filteredLanguages = languages.filter(lang => 
        lang.label.toLowerCase().includes(langSearch.toLowerCase()) ||
        lang.code.toLowerCase().includes(langSearch.toLowerCase())
    );

    useEffect(() => {
        if (state.currentUser) {
            setFirstName(state.currentUser.first_name || '');
            setLastName(state.currentUser.last_name || '');
            setEmail(state.currentUser.email || '');
            setLanguage(state.currentUser.language || 'da');
        }
    }, [state.currentUser]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileSuccess(false);
        setProfileError(null);
        try {
            await api.patch('/users/me/', {
                first_name: firstName,
                last_name: lastName,
                email,
                language
            });
            i18n.changeLanguage(language);
            setProfileSuccess(true);
            await refreshCurrentUser();
        } catch (err: any) {
            console.error(err);
            setProfileError(err.message || t('settings.profile.error_generic', 'Could not update profile.'));
        } finally {
            setProfileLoading(false);
        }
    };

    const handleUpdateSecurity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setSecurityError(t('settings.security.password_mismatch', 'Passwords do not match.'));
            return;
        }
        setSecurityLoading(true);
        setSecuritySuccess(false);
        setSecurityError(null);
        try {
            await api.patch('/users/me/', { password });
            setSecuritySuccess(true);
            setPassword('');
            setConfirmPassword('');
            await refreshCurrentUser();
        } catch (err: any) {
            console.error(err);
            setSecurityError(err.message || t('settings.security.error_generic', 'Could not update password.'));
        } finally {
            setSecurityLoading(false);
        }
    };

    return (
        <div className="h-full bg-gray-300 overflow-y-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
                <header className="mb-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <Settings className="text-blue-600" size={32} />
                            {t('settings.account.title', 'Account Settings')}
                        </h1>
                        <p className="text-gray-600 font-medium mt-1">{t('settings.account.subtitle', 'Manage your personal profile and security settings')}</p>
                    </div>
                </header>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-0">
                    {/* Sidebar Tabs */}
                    <aside className="w-full md:w-64 bg-gray-400 border-r border-gray-500 p-4 shrink-0">
                        <nav className="space-y-1">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${activeTab === 'profile'
                                        ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                                        : 'text-gray-500 hover:bg-white/50 hover:text-gray-900'
                                    }`}
                            >
                                <UserCircle size={20} />
                                {t('settings.tab.account_profile', 'My Account')}
                            </button>
                            <button
                                onClick={() => setActiveTab('security')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${activeTab === 'security'
                                        ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                                        : 'text-gray-500 hover:bg-white/50 hover:text-gray-900'
                                    }`}
                            >
                                <Key size={20} />
                                {t('settings.tab.account_security', 'Security')}
                            </button>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 p-6">
                        {activeTab === 'profile' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-lg font-black text-gray-900">{t('settings.profile.title', 'Personal Profile')}</h2>
                                        <button
                                            type="submit"
                                            disabled={profileLoading}
                                            className="bg-blue-600 text-white px-4 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 hover:bg-blue-700 hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-70"
                                        >
                                            {profileLoading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                            {profileSuccess ? t('settings.profile.saved', 'Saved!') : t('settings.profile.save', 'Save all changes')}
                                        </button>
                                    </div>

                                    {/* Personal Profile Frame */}
                                    <div className="bg-gray-400 p-4 rounded-3xl border-2 border-gray-500 shadow-sm space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-black text-gray-900 uppercase tracking-widest pl-1">{t('settings.profile.firstname_label', 'First Name')}</label>
                                                <input
                                                    type="text"
                                                    value={firstName}
                                                    onChange={e => {
                                                        setFirstName(e.target.value);
                                                        setProfileSuccess(false);
                                                    }}
                                                    className="w-full px-4 py-2 bg-white border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-bold text-sm"
                                                    placeholder="Fornavn"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-black text-gray-900 uppercase tracking-widest pl-1">{t('settings.profile.lastname_label', 'Last Name')}</label>
                                                <input
                                                    type="text"
                                                    value={lastName}
                                                    onChange={e => {
                                                        setLastName(e.target.value);
                                                        setProfileSuccess(false);
                                                    }}
                                                    className="w-full px-4 py-2 bg-white border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-bold text-sm"
                                                    placeholder="Efternavn"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-gray-900 uppercase tracking-widest pl-1">{t('settings.profile.email_label', 'Email Address')}</label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={e => {
                                                    setEmail(e.target.value);
                                                    setProfileSuccess(false);
                                                }}
                                                className="w-full px-4 py-2 bg-white border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-bold text-sm"
                                                placeholder="eksempel@firma.dk"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2 pt-2 border-t border-gray-500/30">
                                            <label className="text-xs font-black text-gray-900 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                                                <Globe size={14} className="text-gray-700" />
                                                {t('settings.profile.language_label', 'Language')}
                                            </label>
                                            <div className="flex gap-2">
                                                <div className="flex-1 py-2 px-4 rounded-xl font-bold border-2 border-blue-600 bg-blue-600 text-white flex items-center justify-center gap-2 text-sm select-none">
                                                    {languages.find(l => l.code === language)?.flag || '🇩🇰'} {languages.find(l => l.code === language)?.label || 'Dansk'}
                                                </div>
                                                
                                                <button
                                                    type="button"
                                                    onClick={() => setShowLangModal(true)}
                                                    className="py-2 px-4 rounded-xl font-bold border-2 border-gray-100 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-600 flex items-center justify-center gap-2 text-sm transition-all shadow-sm"
                                                >
                                                    <span>{t('settings.profile.change_language', 'Choose from list')}</span>
                                                    <ChevronDown size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {profileError && (
                                        <p className="text-red-500 text-xs font-bold mt-2 animate-in shake duration-300">{profileError}</p>
                                    )}

                                    {/* Modal Language Selection popup */}
                                    <Modal
                                        isOpen={showLangModal}
                                        onClose={() => {
                                            setShowLangModal(false);
                                            setLangSearch('');
                                        }}
                                        title={t('settings.profile.language_modal_title', 'Select Language')}
                                        maxWidth="max-w-sm"
                                    >
                                        <div className="space-y-2">
                                            <div className="relative group">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                                                <input
                                                    type="text"
                                                    value={langSearch}
                                                    onChange={e => setLangSearch(e.target.value)}
                                                    placeholder={t('settings.profile.search_languages', 'Search languages...')}
                                                    className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                                                    autoFocus
                                                />
                                                {langSearch && (
                                                    <button
                                                        onClick={() => setLangSearch('')}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-0.5 max-h-60 overflow-y-auto">
                                                {filteredLanguages.length === 0 ? (
                                                    <div className="py-4 text-center text-gray-400 text-xs font-bold">
                                                        {t('settings.profile.no_languages_found', 'No languages found')}
                                                    </div>
                                                ) : (
                                                    filteredLanguages.map(lang => (
                                                        <button
                                                            key={lang.code}
                                                            type="button"
                                                            onClick={() => {
                                                                setLanguage(lang.code);
                                                                setProfileSuccess(false);
                                                                setShowLangModal(false);
                                                                setLangSearch('');
                                                            }}
                                                            className={`w-full text-left px-3 py-1.5 text-sm font-bold flex items-center justify-between rounded-lg transition-all ${
                                                                language === lang.code 
                                                                    ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-sm' 
                                                                    : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                                                            }`}
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <span className="text-lg select-none">{lang.flag}</span>
                                                                <span>{lang.label}</span>
                                                            </span>
                                                            {language === lang.code && <Check size={14} className="text-blue-600" />}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </Modal>
                                </form>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <form onSubmit={handleUpdateSecurity} className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-lg font-black text-gray-900">{t('settings.security.title', 'Account Security')}</h2>
                                        <button
                                            type="submit"
                                            disabled={securityLoading}
                                            className="bg-blue-600 text-white px-4 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 hover:bg-blue-700 hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-70"
                                        >
                                            {securityLoading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                            {securitySuccess ? t('settings.security.updated', 'Password Updated!') : t('settings.security.update', 'Update Password')}
                                        </button>
                                    </div>

                                    {/* Password Reset Frame */}
                                    <div className="bg-gray-400 p-4 rounded-3xl border-2 border-gray-500 shadow-sm space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-gray-900 uppercase tracking-widest pl-1">{t('settings.security.new_password', 'New Password')}</label>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={e => {
                                                    setPassword(e.target.value);
                                                    setSecuritySuccess(false);
                                                    setSecurityError(null);
                                                }}
                                                className="w-full px-4 py-2 bg-white border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-bold text-sm"
                                                placeholder="••••••••"
                                                minLength={6}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-gray-900 uppercase tracking-widest pl-1">{t('settings.security.confirm_password', 'Confirm New Password')}</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={e => {
                                                    setConfirmPassword(e.target.value);
                                                    setSecuritySuccess(false);
                                                    setSecurityError(null);
                                                }}
                                                className="w-full px-4 py-2 bg-white border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-bold text-sm"
                                                placeholder="••••••••"
                                                minLength={6}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {securityError && (
                                        <p className="text-red-500 text-xs font-bold mt-2 animate-in shake duration-300">{securityError}</p>
                                    )}
                                </form>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
