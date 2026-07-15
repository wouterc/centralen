import React, { useState, useEffect } from 'react';
import { useAppState } from '../StateContext';
import { api } from '../api';
import {
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
import Modal from './Modal';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../services/translationService';
import type { Invitation, WorkspaceMembership, User } from '../types';

interface WorkspaceSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    membership: WorkspaceMembership;
}

const WorkspaceSettingsModal: React.FC<WorkspaceSettingsModalProps> = ({ isOpen, onClose, membership }) => {
    const { state, refreshCurrentUser, setActiveWorkspaceId } = useAppState();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'profile' | 'workspace' | 'invitations'>('profile');
    const [workspaceMembers, setWorkspaceMembers] = useState<User[]>([]);

    const workspaceId = membership.company.id;
    const isAdmin = membership.role === 'ADMIN';

    // Profile states
    const [alias, setAlias] = useState('');
    const [userColor, setUserColor] = useState('#3b82f6');
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

    useEffect(() => {
        setAlias(membership.alias || '');
        setUserColor(membership.color || '#3b82f6');
        setWorkspaceName(membership.company.navn);
        setActiveTab('profile');
    }, [membership, isOpen]);

    useEffect(() => {
        if (isOpen) {
            const fetchMembers = async () => {
                try {
                    const data = await api.get<User[]>('/users/', {
                        headers: { 'X-Workspace-Id': workspaceId }
                    });
                    setWorkspaceMembers(data);
                } catch (err) {
                    console.error(err);
                }
            };
            fetchMembers();
        }
    }, [workspaceId, isOpen]);

    useEffect(() => {
        if (isOpen && activeTab === 'invitations' && isAdmin) {
            fetchInvitations();
        }
    }, [activeTab, isAdmin, isOpen]);

    const fetchInvitations = async () => {
        setFetchingInvites(true);
        try {
            const data = await api.get<Invitation[]>('/invitations/', {
                headers: { 'X-Workspace-Id': workspaceId }
            });
            setInvitations(data);
        } catch (err) {
            console.error(t('settings.invitations.error_fetching', 'Could not fetch invitations'), err);
        } finally {
            setFetchingInvites(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileSuccess(false);
        try {
            await api.patch('/memberships/me/', { alias, color: userColor }, {
                headers: { 'X-Workspace-Id': workspaceId }
            });
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
        setWorkspaceLoading(true);
        setWorkspaceSuccess(false);
        try {
            await api.patch(`/companies/${workspaceId}/`, { navn: workspaceName }, {
                headers: { 'X-Workspace-Id': workspaceId }
            });
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
            await api.post('/invitations/', { email: inviteEmail, role: inviteRole }, {
                headers: { 'X-Workspace-Id': workspaceId }
            });
            setInviteEmail('');
            fetchInvitations();
        } catch (err: any) {
            setInviteError(err.response?.data?.detail?.[0] || err.message || t('settings.invitations.error_sending', 'Could not send invitation.'));
        } finally {
            setInviteLoading(false);
        }
    };

    const handleResendInvitation = async (id: number) => {
        try {
            await api.post(`/invitations/${id}/resend/`, null, {
                headers: { 'X-Workspace-Id': workspaceId }
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleCancelInvitation = async (id: number) => {
        try {
            await api.delete(`/invitations/${id}/`, {
                headers: { 'X-Workspace-Id': workspaceId }
            });
            fetchInvitations();
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenLeaveModal = async () => {
        setCheckingLeave(true);
        setLeaveError(null);
        try {
            const check = await api.get<{ can_leave: boolean; error?: string }>(`/companies/${workspaceId}/check_leave/`, {
                headers: { 'X-Workspace-Id': workspaceId }
            });
            if (check.can_leave) {
                setLeaveMode('confirm');
                setShowLeaveModal(true);
            } else {
                setLeaveError(check.error || t('settings.leave.modal.forbidden_description', 'There is a small obstacle before you can leave this workspace.'));
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
        setLeaveError(null);
        setIsLeaving(true);
        try {
            await api.post(`/companies/${workspaceId}/leave/`, null, {
                headers: { 'X-Workspace-Id': workspaceId }
            });
            // If the workspace we left was the active one, we should reset or reload
            if (state.activeWorkspaceId === workspaceId) {
                window.location.href = '/login';
            } else {
                setShowLeaveModal(false);
                onClose();
                await refreshCurrentUser();
            }
        } catch (err: any) {
            setLeaveError(err.message || t('settings.leave.error_generic', 'Could not leave workspace.'));
        } finally {
            setIsLeaving(false);
        }
    };

    const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1',
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('settings.workspace.modal_title', 'Settings for')} ${membership.company.navn}`}
            wide
        >
            <div className="flex flex-col md:flex-row min-h-0 bg-white -m-6 h-[500px]">
                {/* Sidebar Tabs */}
                <aside className="w-full md:w-56 bg-gray-50 border-r border-gray-200 p-4 shrink-0">
                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'profile'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                        >
                            <UserCircle size={16} />
                            {t('settings.tab.profile_short', 'My Profile')}
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('workspace')}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'workspace'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <Building2 size={16} />
                                {t('settings.tab.workspace_short', 'Workspace')}
                            </button>
                        )}
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('invitations')}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'invitations'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <Mail size={16} />
                                {t('settings.tab.invitations_short', 'Invitations')}
                            </button>
                        )}
                        <div className="pt-4 mt-4 border-t border-gray-200">
                            <button
                                onClick={handleOpenLeaveModal}
                                disabled={checkingLeave}
                                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-xs font-black text-red-500 hover:bg-red-50 transition-all whitespace-nowrap disabled:opacity-50"
                            >
                                <div className="flex items-center gap-3">
                                    <LogOut size={16} />
                                    {t('settings.leave.button', 'Leave Workspace')}
                                </div>
                                {checkingLeave && <Loader2 className="animate-spin" size={14} />}
                            </button>
                        </div>

                        {/* List of administrators */}
                        <div className="pt-4 border-t border-gray-200 mt-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-2">
                                {t('settings.workspace.administrators', 'Administrators')}
                            </h4>
                            <div className="space-y-1.5 max-h-28 overflow-y-auto">
                                {workspaceMembers.filter(m => m.role === 'ADMIN').map(admin => (
                                    <div key={admin.id} className="flex items-center gap-2 px-1 py-0.5 text-xs text-gray-700 font-bold">
                                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0" style={{ backgroundColor: admin.color || '#3b82f6' }}>
                                            {(admin.first_name?.[0] || admin.username?.[0] || '').toUpperCase()}
                                        </div>
                                        <span className="truncate">{`${admin.first_name} ${admin.last_name}`.trim() || admin.username}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Link to manage members & teams */}
                        {isAdmin && (
                            <button
                                onClick={() => {
                                    setActiveWorkspaceId(workspaceId);
                                    onClose();
                                    navigate('/users');
                                }}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black text-blue-600 hover:bg-blue-50 transition-all mt-4 border border-dashed border-blue-200"
                            >
                                {t('settings.workspace.manage_members_link', 'Manage members & teams')}
                            </button>
                        )}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 overflow-y-auto">
                    {activeTab === 'profile' && (
                        <div className="animate-in fade-in duration-300">
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-base font-black text-gray-900">{t('settings.profile.title', 'Personal Profile')}</h2>
                                    <button
                                        type="submit"
                                        disabled={profileLoading}
                                        className="bg-blue-600 text-white px-4 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70"
                                    >
                                        {profileLoading ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                                        {profileSuccess ? t('settings.profile.saved', 'Saved!') : t('settings.profile.save', 'Save all changes')}
                                    </button>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest pl-1">{t('settings.profile.alias_label', 'Your Alias')}</label>
                                        <input
                                            type="text"
                                            value={alias}
                                            onChange={e => {
                                                setAlias(e.target.value);
                                                setProfileSuccess(false);
                                            }}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-sm"
                                            placeholder={t('settings.profile.alias_placeholder', 'Enter your preferred name')}
                                        />
                                        <p className="text-[10px] text-gray-500 font-bold">{t('settings.profile.alias_help', 'This name is only visible in the current workspace.')}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest pl-1">{t('settings.profile.color_label', 'Your Color')}</label>
                                        <div className="flex flex-wrap gap-1.5 items-center">
                                            {colors.map(color => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => {
                                                        setUserColor(color);
                                                        setProfileSuccess(false);
                                                    }}
                                                    className={`w-7 h-7 rounded-lg transition-all ${userColor === color ? 'ring-2 ring-blue-500 scale-105 shadow-md' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                                                    style={{ backgroundColor: color }}
                                                >
                                                    {userColor === color && <Check className="text-white mx-auto" size={12} />}
                                                </button>
                                            ))}
                                            <div className="w-px h-5 bg-gray-300 mx-1"></div>
                                            <label 
                                                className={`w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center cursor-pointer transition-all hover:scale-105 overflow-hidden relative ${!colors.includes(userColor) ? 'ring-2 ring-blue-500 scale-105 shadow-md' : 'opacity-70 hover:opacity-100'}`}
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
                                                    <Check className="text-white drop-shadow-md z-10" size={12} />
                                                ) : (
                                                    <Plus className="text-gray-500 z-10" size={12} />
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'workspace' && isAdmin && (
                        <div className="animate-in fade-in duration-300">
                            <h2 className="text-base font-black text-gray-900 mb-3">{t('settings.workspace.title', 'Workspace Settings')}</h2>
                            <form onSubmit={handleUpdateWorkspace} className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest pl-1">{t('settings.workspace.name_label', 'Workspace Name')}</label>
                                    <input
                                        type="text"
                                        value={workspaceName}
                                        onChange={e => setWorkspaceName(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-sm"
                                    />
                                </div>

                                <div className="pt-3 border-t border-gray-200">
                                    <button
                                        type="submit"
                                        disabled={workspaceLoading}
                                        className="bg-blue-600 text-white px-4 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70"
                                    >
                                        {workspaceLoading ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                                        {workspaceSuccess ? t('settings.workspace.updated', 'Updated!') : t('settings.workspace.update', 'Update workspace')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'invitations' && isAdmin && (
                        <div className="animate-in fade-in duration-300 space-y-4">
                            <h2 className="text-base font-black text-gray-900">{t('settings.invitations.title', 'Invitations')}</h2>

                            <form onSubmit={handleInvite} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 focus-within:border-blue-500 transition-colors">
                                <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{t('settings.invitations.invite_label', 'Invite new member')}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        placeholder="email@eksempel.dk"
                                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-sm"
                                        required
                                    />
                                    <select
                                        value={inviteRole}
                                        onChange={e => setInviteRole(e.target.value as any)}
                                        className="px-2 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-gray-600 text-sm"
                                    >
                                        <option value="MEMBER">{t('settings.invitations.role.member', 'Member')}</option>
                                        <option value="ADMIN">{t('settings.invitations.role.admin', 'Administrator')}</option>
                                    </select>
                                    <button
                                        type="submit"
                                        disabled={inviteLoading}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70"
                                    >
                                        {inviteLoading ? <Loader2 className="animate-spin" size={12} /> : <Plus size={12} />}
                                        {t('settings.invitations.send', 'Send')}
                                    </button>
                                </div>
                                {inviteError && (
                                    <p className="text-red-500 text-xs font-bold mt-2 pl-1 animate-in shake duration-300">{inviteError}</p>
                                )}
                            </form>

                            <div className="space-y-2">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('settings.invitations.pending_title', 'Pending invitations')}</h3>
                                {fetchingInvites ? (
                                    <div className="py-6 text-center text-gray-400">
                                        <Loader2 className="animate-spin mx-auto mb-1" size={20} />
                                        {t('settings.invitations.fetching', 'Fetching...')}
                                    </div>
                                ) : invitations.length === 0 ? (
                                    <div className="py-6 text-center text-xs font-bold text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                        {t('settings.invitations.none', 'No pending invitations')}
                                    </div>
                                ) : (
                                    invitations.map(inv => (
                                        <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white text-indigo-600 rounded-lg flex items-center justify-center border border-gray-100 shadow-sm">
                                                    <Mail size={14} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-xs text-gray-900">{inv.email}</div>
                                                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{inv.role}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => handleResendInvitation(inv.id)}
                                                    className="p-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg border border-gray-200 transition-all active:scale-95 shadow-sm"
                                                    title={t('settings.invitations.resend_tooltip', 'Send invitation again')}
                                                >
                                                    <RefreshCcw size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleCancelInvitation(inv.id)}
                                                    className="p-2 bg-white text-red-500 hover:bg-red-50 rounded-lg border border-gray-200 transition-all active:scale-95 shadow-sm"
                                                    title={t('settings.invitations.cancel_tooltip', 'Cancel invitation')}
                                                >
                                                    <X size={14} />
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

            {/* Leave Workspace Confirmation Modal */}
            {showLeaveModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white max-w-sm w-full rounded-3xl shadow-2xl p-6 border border-gray-100 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${leaveMode === 'forbidden' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                                <AlertTriangle size={24} />
                            </div>
                            <button 
                                onClick={() => { setShowLeaveModal(false); setLeaveError(null); }}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        <h3 className="text-lg font-black text-gray-900 mb-1">
                            {leaveMode === 'forbidden' 
                                ? t('settings.leave.modal.forbidden_title', 'Whoops, wait!') 
                                : t('settings.leave.modal.title', 'Leave workspace?')
                            }
                        </h3>
                        <p className="text-xs text-gray-500 mb-6 font-bold leading-relaxed">
                            {leaveMode === 'forbidden' 
                                ? t('settings.leave.modal.forbidden_description', 'There is a small obstacle before you can leave this workspace.')
                                : t('settings.leave.modal.description', 'Are you sure you want to leave {{name}}? You will need to be invited again to regain access.', { name: membership.company.navn })
                            }
                        </p>

                        {leaveError && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in shake duration-300">
                                <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center shrink-0 border border-red-100">
                                    <AlertTriangle className="text-red-900" size={16} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-red-900 font-black uppercase tracking-tight">{t('settings.leave.modal.error_title', 'Important notice')}</p>
                                    <p className="text-red-800 font-bold text-xs leading-tight mt-0.5">{leaveError}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setShowLeaveModal(false); setLeaveError(null); }}
                                disabled={isLeaving}
                                className="px-4 py-2 font-black rounded-xl text-xs text-gray-500 hover:bg-gray-50 uppercase tracking-widest"
                            >
                                {leaveMode === 'forbidden' ? t('settings.leave.modal.understand', 'I understand') : t('settings.leave.modal.cancel', 'Cancel')}
                            </button>
                            
                            {leaveMode === 'confirm' && (
                                <button
                                    onClick={handleLeaveWorkspace}
                                    disabled={isLeaving}
                                    className="px-5 py-2 bg-red-600 text-white font-black rounded-xl text-xs shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-1.5"
                                >
                                    {isLeaving ? <Loader2 className="animate-spin" size={14} /> : t('settings.leave.modal.confirm', 'Leave now')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default WorkspaceSettingsModal;
