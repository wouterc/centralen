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
    RefreshCcw
} from 'lucide-react';
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
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);

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
        <div className="flex-1 bg-gray-300 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <Settings className="text-blue-600" size={32} />
                            {t('settings.title', 'Indstillinger')} {activeMembership?.company.navn}
                        </h1>
                        <p className="text-gray-600 font-medium mt-1">{t('settings.subtitle', 'Administrer din profil og dit arbejdsrum')}</p>
                    </div>
                </header>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
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
                    <main className="flex-1 p-8">
                        {activeTab === 'profile' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <h2 className="text-xl font-black text-gray-900 mb-6">{t('settings.profile.title', 'Personlig Profil')}</h2>
                                <form onSubmit={handleUpdateProfile} className="space-y-8 bg-gray-400 p-8 rounded-4xl border-2 border-gray-500 shadow-sm">
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-gray-900 uppercase tracking-widest pl-1">{t('settings.profile.alias_label', 'Dit Alias i')} {activeMembership?.company.navn}</label>
                                        <input
                                            type="text"
                                            value={alias}
                                            onChange={e => setAlias(e.target.value)}
                                            className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-bold"
                                            placeholder={t('settings.profile.alias_placeholder', 'Indtast dit foretrukne navn')}
                                        />
                                        <p className="text-xs text-gray-700 font-bold">{t('settings.profile.alias_help', 'Dette navn vises kun i det nuværende arbejdsrum.')}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-gray-900 uppercase tracking-widest pl-1">{t('settings.profile.color_label', 'Din Farve')}</label>
                                        <div className="flex flex-wrap gap-3">
                                            {colors.map(color => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setUserColor(color)}
                                                    className={`w-10 h-10 rounded-xl transition-all ${userColor === color ? 'ring-4 ring-blue-600/20 scale-110 shadow-lg' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                                                    style={{ backgroundColor: color }}
                                                >
                                                    {userColor === color && <Check className="text-white mx-auto" size={16} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-gray-900 uppercase tracking-widest pl-1">{t('settings.profile.language_label', 'Sprog')}</label>
                                        <div className="flex gap-4">
                                            <button 
                                                type="button"
                                                onClick={() => setLanguage('da')}
                                                className={`flex-1 py-4 rounded-2xl font-bold transition-all border-2 flex items-center justify-center gap-2 ${language === 'da' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200'}`}
                                            >
                                                🇩🇰 Dansk
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setLanguage('en')}
                                                className={`flex-1 py-4 rounded-2xl font-bold transition-all border-2 flex items-center justify-center gap-2 ${language === 'en' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200'}`}
                                            >
                                                🇬🇧 English
                                            </button>
                                        </div>
                                    </div>
                                  <div className="pt-6 border-t border-gray-500/30">
                                        <button
                                            type="submit"
                                            disabled={profileLoading}
                                            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-70"
                                        >
                                            {profileLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                            {profileSuccess ? t('settings.profile.saved', 'Gemt!') : t('settings.profile.save', 'Gem ændringer')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'workspace' && isAdmin && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <h2 className="text-xl font-black text-gray-900 mb-6">Arbejdsrum Indstillinger</h2>
                                <form onSubmit={handleUpdateWorkspace} className="space-y-8 bg-gray-400 p-8 rounded-4xl border-2 border-gray-500 shadow-sm">
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-gray-900 uppercase tracking-widest pl-1">Arbejdsrum Navn</label>
                                        <input
                                            type="text"
                                            value={workspaceName}
                                            onChange={e => setWorkspaceName(e.target.value)}
                                            className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-bold"
                                        />
                                    </div>

                                    <div className="pt-6 border-t border-gray-500/30">
                                        <button
                                            type="submit"
                                            disabled={workspaceLoading}
                                            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-70"
                                        >
                                            {workspaceLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                            {workspaceSuccess ? t('settings.workspace.updated', 'Opdateret!') : t('settings.workspace.update', 'Opdater arbejdsrum')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'invitations' && isAdmin && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <h2 className="text-xl font-black text-gray-900 mb-6">{t('settings.invitations.title', 'Invitationer')}</h2>

                                <form onSubmit={handleInvite} className="mb-10 bg-gray-400 p-6 rounded-3xl border-2 border-gray-500 transition-all focus-within:border-blue-500">
                                    <label className="block text-xs font-black text-blue-600 uppercase tracking-widest mb-4">{t('settings.invitations.invite_label', 'Inviter nyt medlem')}</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="email"
                                            value={inviteEmail}
                                            onChange={e => setInviteEmail(e.target.value)}
                                            placeholder="email@eksempel.dk"
                                            className="flex-1 px-6 py-4 bg-white border border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-bold"
                                            required
                                        />
                                        <select
                                            value={inviteRole}
                                            onChange={e => setInviteRole(e.target.value as any)}
                                            className="px-4 py-4 bg-white border border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-bold text-gray-600"
                                        >
                                            <option value="MEMBER">{t('settings.invitations.role.member', 'Medlem')}</option>
                                            <option value="ADMIN">{t('settings.invitations.role.admin', 'Administrator')}</option>
                                        </select>
                                        <button
                                            type="submit"
                                            disabled={inviteLoading}
                                            className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70"
                                        >
                                            {inviteLoading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
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
