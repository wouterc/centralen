import React, { useState, useEffect } from 'react';
import { useAppState } from '../StateContext';
import { api } from '../api';
import {
    Settings,
    Building2,
    Mail,
    AlertTriangle,
    Save,
    Check,
    X,
    UserCircle,
    LogOut,
    Plus,
    Loader2,
    RefreshCcw,
    ChevronDown,
    Search
} from 'lucide-react';
import Modal from '../components/Modal';

const languages = [
    { code: 'da', label: 'Dansk', flag: '🇩🇰' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

import { useTranslation } from '../services/translationService';
import type { Invitation } from '../types';

const SettingsPage: React.FC = () => {
    const { state, refreshCurrentUser } = useAppState();
    const { t, i18n } = useTranslation();
    const [activeTab, setActiveTab] = useState<'profile' | 'workspace' | 'invitations'>('profile');

    // Profile states
    const [alias, setAlias] = useState('');
    const [userColor, setUserColor] = useState('#3b82f6');
    const [language, setLanguage] = useState(i18n.language || 'da');
    const [showLangModal, setShowLangModal] = useState(false);
    const [langSearch, setLangSearch] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);

    const filteredLanguages = languages.filter(lang => 
        lang.label.toLowerCase().includes(langSearch.toLowerCase()) ||
        lang.code.toLowerCase().includes(langSearch.toLowerCase())
    );

    // Workspace states
    const [workspaceName, setWorkspaceName] = useState('');
    const [workspaceLoading, setWorkspaceLoading] = useState(false);
    const [workspaceSuccess, setWorkspaceSuccess] = useState(false);

    // Invitations states
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [fetchingInvites, setFetchingInvites] = useState(false);

    // Modal states
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [leaveError, setLeaveError] = useState<string | null>(null);
    const [isLeaving, setIsLeaving] = useState(false);
    const [checkingLeave, setCheckingLeave] = useState(false);
    const [leaveMode, setLeaveMode] = useState<'confirm' | 'forbidden'>('confirm');

    const activeMembership = state.currentUser?.memberships?.find(m => m.company.id === state.activeWorkspaceId);
    const isAdmin = activeMembership?.role === 'ADMIN';

    useEffect(() => {
        if (activeMembership) {
            setAlias(activeMembership.alias || '');
            setUserColor(activeMembership.color || '#3b82f6');
            setWorkspaceName(activeMembership.company.navn);
        }
    }, [activeMembership]);

    useEffect(() => {
        if (state.currentUser?.language) {
            setLanguage(state.currentUser.language);
        }
    }, [state.currentUser]);

    useEffect(() => {
        if (activeTab === 'invitations' && isAdmin) {
            fetchInvitations();
        }
    }, [activeTab, isAdmin]);

    const fetchInvitations = async () => {
        setFetchingInvites(true);
        try {
            const data = await api.get<Invitation[]>('/invitations/');
            setInvitations(data);
        } catch (err) {
            console.error(t('settings.invitations.error_fetching', 'Kunne ikke hente invitationer'), err);
        } finally {
            setFetchingInvites(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileSuccess(false);
        try {
            await Promise.all([
                api.patch('/memberships/me/', { alias, color: userColor }),
                api.patch('/users/me/', { language })
            ]);
            i18n.changeLanguage(language);
            setProfileSuccess(true);
            await refreshCurrentUser();
        } catch (err) {
            console.error(err);
        } finally {
            setProfileLoading(false);
        }
    };

    const handleUpdateWorkspace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!state.activeWorkspaceId) return;
        setWorkspaceLoading(true);
        setWorkspaceSuccess(false);
        try {
            await api.patch(`/companies/${state.activeWorkspaceId}/`, { navn: workspaceName });
            setWorkspaceSuccess(true);
            await refreshCurrentUser();
        } catch (err) {
            console.error(err);
        } finally {
            setWorkspaceLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);
        setInviteError(null);
        try {
            await api.post('/invitations/', { email: inviteEmail, role: inviteRole });
            setInviteEmail('');
            fetchInvitations();
        } catch (err: any) {
            setInviteError(err.response?.data?.detail?.[0] || err.message || t('settings.invitations.error_sending', 'Kunne ikke sende invitation.'));
        } finally {
            setInviteLoading(false);
        }
    };

    const handleResendInvitation = async (id: number) => {
        try {
            await api.post(`/invitations/${id}/resend/`);
            // Brief success state could be added here
        } catch (err) {
            console.error(err);
        }
    };


    const handleCancelInvitation = async (id: number) => {
        try {
            await api.delete(`/invitations/${id}/`);
            fetchInvitations();
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenLeaveModal = async () => {
        if (!state.activeWorkspaceId) return;
        setCheckingLeave(true);
        setLeaveError(null);
        try {
            const check = await api.get<{ can_leave: boolean; error?: string }>(`/companies/${state.activeWorkspaceId}/check_leave/`);
            if (check.can_leave) {
                setLeaveMode('confirm');
                setShowLeaveModal(true);
            } else {
                setLeaveError(check.error || t('settings.leave.modal.forbidden_description', 'Du kan ikke forlade dette arbejdsrum.'));
                setLeaveMode('forbidden');
                setShowLeaveModal(true);
            }
        } catch (err: any) {
            setLeaveMode('confirm');
            setShowLeaveModal(true);
        } finally {
            setCheckingLeave(false);
        }
    };

    const handleLeaveWorkspace = async () => {
        if (!state.activeWorkspaceId) return;
        setLeaveError(null);
        setIsLeaving(true);
        try {
            await api.post(`/companies/${state.activeWorkspaceId}/leave/`);
            window.location.href = '/login';
        } catch (err: any) {
            setLeaveError(err.response?.data?.error || t('settings.leave.error_generic', 'Kunne ikke forlade arbejdsrum.'));
        } finally {
            setIsLeaving(false);
        }
    };

    const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1',
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'
    ];

    return (
        <div className="h-full bg-gray-300 overflow-y-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
                <header className="mb-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <Settings className="text-blue-600" size={32} />
                            {t('settings.title', 'Indstillinger')} {activeMembership?.company.navn}
                        </h1>
                        <p className="text-gray-600 font-medium mt-1">{t('settings.subtitle', 'Administrer din profil og dit arbejdsrum')}</p>
                    </div>
                </header>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-0">
                    {/* Sidebar Tabs */}
                    <aside className="w-full md:w-64 bg-gray-400 border-r border-gray-500 p-4">
                        <nav className="space-y-1">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${activeTab === 'profile'
                                        ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                                        : 'text-gray-500 hover:bg-white/50 hover:text-gray-900'
                                    }`}
                            >
                                <UserCircle size={20} />
                                {t('settings.tab.profile', 'Min Profil')}
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => setActiveTab('workspace')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${activeTab === 'workspace'
                                            ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                                            : 'text-gray-500 hover:bg-white/50 hover:text-gray-900'
                                        }`}
                                >
                                    <Building2 size={20} />
                                    {t('settings.tab.workspace', 'Arbejdsrum')}
                                </button>
                            )}
                            {isAdmin && (
                                <button
                                    onClick={() => setActiveTab('invitations')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${activeTab === 'invitations'
                                            ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                                            : 'text-gray-500 hover:bg-white/50 hover:text-gray-900'
                                        }`}
                                >
                                    <Mail size={20} />
                                    {t('settings.tab.invitations', 'Invitationer')}
                                </button>
                            )}
                            <div className="pt-4 mt-4 border-t border-gray-100">
                                <button
                                    onClick={handleOpenLeaveModal}
                                    disabled={checkingLeave}
                                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm font-black text-red-500 hover:bg-red-50 transition-all whitespace-nowrap disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <LogOut size={20} />
                                        {t('settings.leave.button', 'Forlad arbejdsrum')}
                                    </div>
                                    {checkingLeave && <Loader2 className="animate-spin" size={16} />}
                                </button>
                            </div>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 p-3 md:p-4">
                        {activeTab === 'profile' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <form onSubmit={handleUpdateProfile} className="space-y-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-lg font-black text-gray-900">{t('settings.profile.title', 'Personlig Profil')}</h2>
                                        <button
                                            type="submit"
                                            disabled={profileLoading}
                                            className="bg-blue-600 text-white px-4 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 hover:bg-blue-700 hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-70"
                                        >
                                            {profileLoading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                            {profileSuccess ? t('settings.profile.saved', 'Gemt!') : t('settings.profile.save', 'Gem alle ændringer')}
                                        </button>
                                    </div>

                                    {/* Arbejdsrum Profil Frame */}
                                    <div className="bg-gray-400 p-3 rounded-2xl border-2 border-gray-500 shadow-sm space-y-3">
                                        <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest pl-1">
                                            {t('settings.profile.workspace_section', 'Arbejdsrum Profil')} ({activeMembership?.company.navn})
                                        </h3>
                                        
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-900 uppercase tracking-widest pl-1">{t('settings.profile.alias_label', 'Dit Alias')}</label>
                                            <input
                                                type="text"
                                                value={alias}
                                                onChange={e => {
                                                    setAlias(e.target.value);
                                                    setProfileSuccess(false);
                                                }}
                                                className="w-full px-4 py-2 bg-white border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-bold text-sm"
                                                placeholder={t('settings.profile.alias_placeholder', 'Indtast dit foretrukne navn')}
                                            />
                                            <p className="text-[11px] text-gray-700 font-bold">{t('settings.profile.alias_help', 'Dette navn vises kun i det nuværende arbejdsrum.')}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-900 uppercase tracking-widest pl-1">{t('settings.profile.color_label', 'Din Farve')}</label>
                                            <div className="flex flex-wrap gap-2 items-center">
                                                {colors.map(color => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => {
                                                            setUserColor(color);
                                                            setProfileSuccess(false);
                                                        }}
                                                        className={`w-8 h-8 rounded-lg transition-all ${userColor === color ? 'ring-3 ring-blue-600/30 scale-110 shadow-lg' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                                                        style={{ backgroundColor: color }}
                                                    >
                                                        {userColor === color && <Check className="text-white mx-auto" size={14} />}
                                                    </button>
                                                ))}
                                                <div className="w-px h-6 bg-gray-500/30 mx-1"></div>
                                                <label 
                                                    className={`w-8 h-8 rounded-lg border-2 border-gray-500/50 flex items-center justify-center cursor-pointer transition-all hover:scale-105 overflow-hidden relative ${!colors.includes(userColor) ? 'ring-3 ring-blue-600/30 scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'}`}
                                                    title={t('settings.profile.custom_color', 'Vælg egen farve')}
                                                    style={{ backgroundColor: !colors.includes(userColor) ? userColor : '#ffffff' }}
                                                >
                                                    <input 
                                                        type="color" 
                                                        value={colors.includes(userColor) ? '#3b82f6' : userColor} 
                                                        onChange={e => {
                                                            setUserColor(e.target.value);
                                                            setProfileSuccess(false);
                                                        }} 
                                                        className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer border-0 p-0 opacity-0"
                                                    />
                                                    {!colors.includes(userColor) ? (
                                                        <Check className="text-white drop-shadow-md z-10" size={14} />
                                                    ) : (
                                                        <Plus className="text-gray-500 z-10" size={14} />
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Globale Indstillinger Frame */}
                                    <div className="bg-gray-400 p-3 rounded-2xl border-2 border-gray-500 shadow-sm space-y-3">
                                        <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest pl-1">
                                            {t('settings.profile.global_section', 'Globale Indstillinger')}
                                        </h3>
                                        
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-900 uppercase tracking-widest pl-1">{t('settings.profile.language_label', 'Sprog')}</label>
                                            <div className="flex gap-2">
                                                {/* Button showing current choice */}
                                                <div className="flex-1 py-2 px-4 rounded-xl font-bold border-2 border-blue-600 bg-blue-600 text-white flex items-center justify-center gap-2 text-sm select-none">
                                                    {languages.find(l => l.code === language)?.flag || '🇩🇰'} {languages.find(l => l.code === language)?.label || 'Dansk'}
                                                </div>
                                                
                                                {/* Button to toggle list */}
                                                <button
                                                    type="button"
                                                    onClick={() => setShowLangModal(true)}
                                                    className="py-2 px-4 rounded-xl font-bold border-2 border-gray-100 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-600 flex items-center justify-center gap-2 text-sm transition-all"
                                                >
                                                    <span>{t('settings.profile.change_language', 'Vælg fra liste')}</span>
                                                    <ChevronDown size={16} />
                                                </button>
                                            </div>

                                            {/* Modal Language Selection popup */}
                                            <Modal
                                                isOpen={showLangModal}
                                                onClose={() => {
                                                    setShowLangModal(false);
                                                    setLangSearch('');
                                                }}
                                                title={t('settings.profile.language_modal_title', 'Vælg Sprog')}
                                                maxWidth="max-w-sm"
                                            >
                                                <div className="space-y-2">
                                                    {/* Search input */}
                                                    <div className="relative group">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                                                        <input
                                                            type="text"
                                                            value={langSearch}
                                                            onChange={e => setLangSearch(e.target.value)}
                                                            placeholder={t('settings.profile.search_languages', 'Søg efter sprog...')}
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

                                                    {/* Language list */}
                                                    <div className="space-y-0.5 max-h-60 overflow-y-auto">
                                                        {filteredLanguages.length === 0 ? (
                                                            <div className="py-4 text-center text-gray-400 text-xs font-bold">
                                                                {t('settings.profile.no_languages_found', 'Ingen sprog fundet')}
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
                                        </div>
                                    </div>

                                    {/* Submit button */}
                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={profileLoading}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-70"
                                        >
                                            {profileLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                            {profileSuccess ? t('settings.profile.saved', 'Gemt!') : t('settings.profile.save', 'Gem alle ændringer')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'workspace' && isAdmin && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <h2 className="text-lg font-black text-gray-900 mb-3">Arbejdsrum Indstillinger</h2>
                                <form onSubmit={handleUpdateWorkspace} className="space-y-4 bg-gray-400 p-4 rounded-3xl border-2 border-gray-500 shadow-sm">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-900 uppercase tracking-widest pl-1">Arbejdsrum Navn</label>
                                        <input
                                            type="text"
                                            value={workspaceName}
                                            onChange={e => setWorkspaceName(e.target.value)}
                                            className="w-full px-4 py-2 bg-white border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-bold text-sm"
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-gray-500/30">
                                        <button
                                            type="submit"
                                            disabled={workspaceLoading}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-70"
                                        >
                                            {workspaceLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                            {workspaceSuccess ? t('settings.workspace.updated', 'Opdateret!') : t('settings.workspace.update', 'Opdater arbejdsrum')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'invitations' && isAdmin && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <h2 className="text-lg font-black text-gray-900 mb-3">{t('settings.invitations.title', 'Invitationer')}</h2>

                                <form onSubmit={handleInvite} className="mb-4 bg-gray-400 p-4 rounded-3xl border-2 border-gray-500 transition-all focus-within:border-blue-500">
                                    <label className="block text-xs font-black text-blue-600 uppercase tracking-widest mb-2">{t('settings.invitations.invite_label', 'Inviter nyt medlem')}</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            value={inviteEmail}
                                            onChange={e => setInviteEmail(e.target.value)}
                                            placeholder="email@eksempel.dk"
                                            className="flex-1 px-4 py-2 bg-white border border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-bold text-sm"
                                            required
                                        />
                                        <select
                                            value={inviteRole}
                                            onChange={e => setInviteRole(e.target.value as any)}
                                            className="px-3 py-2 bg-white border border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-bold text-gray-600 text-sm"
                                        >
                                            <option value="MEMBER">{t('settings.invitations.role.member', 'Medlem')}</option>
                                            <option value="ADMIN">{t('settings.invitations.role.admin', 'Administrator')}</option>
                                        </select>
                                        <button
                                            type="submit"
                                            disabled={inviteLoading}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70"
                                        >
                                            {inviteLoading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                            {t('settings.invitations.send', 'Send')}
                                        </button>
                                    </div>
                                    {inviteError && (
                                        <p className="text-red-500 text-xs font-bold mt-3 pl-1 animate-in shake duration-300">{inviteError}</p>
                                    )}
                                </form>

                                <div className="space-y-3">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1 mb-4">{t('settings.invitations.pending_title', 'Afventende invitationer')}</h3>
                                    {fetchingInvites ? (
                                        <div className="py-10 text-center text-gray-400">
                                            <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                                            {t('settings.invitations.fetching', 'Henter...')}
                                        </div>
                                    ) : invitations.length === 0 ? (
                                        <div className="py-10 text-center text-gray-500 font-black bg-gray-300 rounded-3xl border-2 border-dashed border-gray-500">
                                            {t('settings.invitations.none', 'Ingen afventende invitationer')}
                                        </div>
                                    ) : (
                                        invitations.map(inv => (
                                            <div key={inv.id} className="flex items-center justify-between p-4 bg-gray-300 border border-gray-500 rounded-2xl hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                                                        <Mail size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-gray-900">{inv.email}</div>
                                                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{inv.role}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleResendInvitation(inv.id)}
                                                        className="p-2.5 bg-white text-blue-600 hover:bg-blue-50 rounded-xl shadow-sm border border-gray-200 transition-all active:scale-95"
                                                        title={t('settings.invitations.resend_tooltip', 'Send invitation igen')}
                                                    >
                                                        <RefreshCcw size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelInvitation(inv.id)}
                                                        className="p-2.5 bg-white text-red-500 hover:bg-red-50 rounded-xl shadow-sm border border-gray-200 transition-all active:scale-95"
                                                        title={t('settings.invitations.cancel_tooltip', 'Træk invitation tilbage')}
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Leave Workspace Confirmation Modal */}
            {showLeaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white max-w-md w-full rounded-4xl shadow-2xl p-8 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${leaveMode === 'forbidden' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                                <AlertTriangle size={32} />
                            </div>
                            <button 
                                onClick={() => { setShowLeaveModal(false); setLeaveError(null); }}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <X size={24} className="text-gray-400" />
                            </button>
                        </div>

                        <h3 className="text-2xl font-black text-gray-900 mb-2">
                            {leaveMode === 'forbidden' 
                                ? t('settings.leave.modal.forbidden_title', 'Hov, vend vent!') 
                                : t('settings.leave.modal.title', 'Forlad arbejdsrum?')
                            }
                        </h3>
                        <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                            {leaveMode === 'forbidden' 
                                ? t('settings.leave.modal.forbidden_description', 'Der er en lille forhindring, før du kan forlade dette arbejdsrum.')
                                : t('settings.leave.modal.description', 'Er du sikker på, at du vil forlade {{name}}? Du skal inviteres igen for at få adgang på ny.', { name: activeMembership?.company.navn })
                            }
                        </p>

                        {leaveError && (
                            <div className="mb-10 p-5 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4 animate-in shake duration-300">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                                    <AlertTriangle className="text-red-900" size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-red-900 font-black text-xs mb-1 uppercase tracking-tight">{t('settings.leave.modal.error_title', 'Vigtig besked')}</p>
                                    <p className="text-red-800 font-bold text-[13px] leading-tight">{leaveError}</p>
                                </div>
                            </div>
                        )}

                        <div className={leaveMode === 'forbidden' ? 'flex justify-end' : 'grid grid-cols-2 gap-4'}>
                            <button
                                onClick={() => { setShowLeaveModal(false); setLeaveError(null); }}
                                disabled={isLeaving}
                                className={`py-4 font-black rounded-2xl transition-all disabled:opacity-50 ${
                                    leaveMode === 'forbidden' 
                                    ? 'bg-gray-900 text-white px-10 hover:bg-black shadow-lg shadow-gray-200' 
                                    : 'text-gray-500 hover:bg-gray-50 uppercase tracking-widest text-xs'
                                }`}
                            >
                                {leaveMode === 'forbidden' ? t('settings.leave.modal.understand', 'Jeg forstår') : t('settings.leave.modal.cancel', 'Annuller')}
                            </button>
                            
                            {leaveMode === 'confirm' && (
                                <button
                                    onClick={handleLeaveWorkspace}
                                    disabled={isLeaving}
                                    className="w-full py-4 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {isLeaving ? <Loader2 className="animate-spin" size={20} /> : t('settings.leave.modal.confirm', 'Forlad nu')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
