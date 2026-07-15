import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAppState } from '../StateContext';
import { User as UserIcon, Lock, Loader2, ArrowRight, Building2, Plus, Mail, HelpCircle } from 'lucide-react';
import { useTranslation } from '../services/translationService';
import type { User, Team, WorkspaceMembership } from '../types';
import LanguageSelector from '../components/LanguageSelector';

const LoginPage: React.FC = () => {
    const { state, setState } = useAppState();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'login' | 'select-workspace'>('login');
    const [tempUser, setTempUser] = useState<User | null>(null);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [workspaceSubmitting, setWorkspaceSubmitting] = useState(false);
    const [showDirectCreation, setShowDirectCreation] = useState(false);

    React.useEffect(() => {
        if (state.currentUser && (!state.currentUser.memberships || state.currentUser.memberships.length === 0)) {
            setTempUser(state.currentUser);
            setStep('select-workspace');
        }
    }, [state.currentUser]);

    React.useEffect(() => {
        if (tempUser && !newWorkspaceName) {
            const rawName = (tempUser.first_name || tempUser.username || "").trim();
            const name = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : "User";
            const lang = tempUser.language || 'da';
            if (name.toLowerCase().endsWith('s') || name.toLowerCase().endsWith('x') || name.toLowerCase().endsWith('z')) {
                if (lang === 'fr') setNewWorkspaceName(`Lab de ${name}`);
                else if (lang === 'en') setNewWorkspaceName(`${name}'s Lab`);
                else setNewWorkspaceName(`${name}' Lab`);
            } else {
                if (lang === 'fr') setNewWorkspaceName(`Lab de ${name}`);
                else if (lang === 'en') setNewWorkspaceName(`${name}'s Lab`);
                else setNewWorkspaceName(`${name}s Lab`);
            }
        }
    }, [tempUser, newWorkspaceName]);

    const handleCreateWorkspace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWorkspaceName.trim()) return;
        setWorkspaceSubmitting(true);
        setError(null);

        try {
            const newCompany = await api.post<{ id: string; navn: string }>('/companies/', {
                navn: newWorkspaceName.trim()
            });

            localStorage.setItem('activeWorkspaceId', newCompany.id);

            // Fetch refreshed data
            const updatedUser = await api.get<any>('/users/me/');
            const users = await api.get<any[]>('/users/');
            const teams = await api.get<any[]>('/teams/');

            setState(prev => ({
                ...prev,
                currentUser: updatedUser,
                activeWorkspaceId: newCompany.id,
                users,
                teams
            }));

            navigate('/board');
        } catch (err: any) {
            console.error("Fejl ved oprettelse af arbejdsrum:", err);
            setError(err.message || t('workspace.create.error', 'Could not create the workspace. Please try again.'));
        } finally {
            setWorkspaceSubmitting(false);
        }
    };

    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

    const handleResendActivation = async () => {
        setResendStatus('sending');
        try {
            await api.post('/resend-activation/', { email });
            setResendStatus('sent');
        } catch (err) {
            console.error("Resend error:", err);
            setResendStatus('failed');
        }
    };

    const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
    const [showHelp, setShowHelp] = useState(false);

    React.useEffect(() => {
        if (step === 'select-workspace') {
            fetchPendingInvitations();
        }
    }, [step]);

    const fetchPendingInvitations = async () => {
        try {
            const data = await api.get<any[]>('/my-invitations/');
            setPendingInvitations(data);
        } catch (err) {
            console.error("Kunne ikke hente invitationer:", err);
        }
    };

    const handleAcceptInvitation = async (invId: number) => {
        setLoading(true);
        try {
            const res = await api.post<{ status: string; workspace_id: string }>(`/my-invitations/${invId}/accept/`);
            localStorage.setItem('activeWorkspaceId', res.workspace_id);
            
            // Re-fetch current user and navigate to board
            const finalUser = await api.get<User>('/users/me/');
            await finishLogin(finalUser);
        } catch (err) {
            console.error("Kunne ikke acceptere invitation:", err);
            setError(t('login.error.accept_invitation', 'Could not accept invitation'));
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // POST to Django's login endpoint
            await api.post('/login/', { email, password });

            // If success, get the user to check workspaces
            const currentUser = await api.get<User>('/users/me/');

            if (!currentUser.memberships || currentUser.memberships.length === 0) {
                // If no memberships, allow creating a new workspace
                setTempUser(currentUser);
                setStep('select-workspace');
                return;
            }

            if (currentUser.memberships.length === 1) {
                // Only one workspace, select it automatically
                const workspaceId = currentUser.memberships[0].company.id;
                localStorage.setItem('activeWorkspaceId', workspaceId);
                await finishLogin(currentUser);
            } else {
                // Multiple workspaces, show selection
                setTempUser(currentUser);
                setStep('select-workspace');
            }
        } catch (err: any) {
            console.error("Login fejl:", err);
            const code = err.data?.code;
            if (code === 'not_activated') {
                setError('not_activated');
                setResendStatus('idle');
            } else {
                setError(t('login.error.default', 'Email or password is incorrect'));
            }
        } finally {
            setLoading(false);
        }
    };

    const selectWorkspace = async (workspaceId: string) => {
        if (!tempUser) return;
        setLoading(true);
        localStorage.setItem('activeWorkspaceId', workspaceId);
        try {
            await finishLogin(tempUser);
        } catch (err) {
            setError(t('login.error.select_workspace', 'Could not select workspace'));
            setLoading(false);
        }
    };



    const finishLogin = async (_user: User) => {
        // Refresh global state with full data filtered by the new activeWorkspaceId
        const users = await api.get<User[]>('/users/');
        const teams = await api.get<Team[]>('/teams/');
        // Re-fetch current user to get potential alias/color for this specific workspace
        const finalUser = await api.get<User>('/users/me/');

        setState(prev => ({
            ...prev,
            currentUser: finalUser,
            users,
            teams,
            activeWorkspaceId: localStorage.getItem('activeWorkspaceId')
        }));
        navigate('/board');
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('activeWorkspaceId');
        setState(prev => ({
            ...prev,
            currentUser: null,
            users: [],
            teams: [],
            activeWorkspaceId: null
        }));
        setStep('login');
        setEmail('');
        setPassword('');
        setError(null);
        setLoading(false);
        setTempUser(null);
    };

    const memberships = tempUser?.memberships || [];

    return (
        <div className="h-screen bg-gray-300 flex flex-col p-6 overflow-y-auto">
            {/* Float Language Selector */}
            <div className="fixed top-6 right-6 z-50">
                <LanguageSelector />
            </div>

            {/* Background Decorations */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-40 animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-md my-auto mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
                {/* Logo & Header */}
                <div className="text-center mb-10">
                    <div className="relative inline-block">
                        <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-4xl shadow-2xl mx-auto mb-6 transform hover:rotate-6 transition-transform cursor-default">
                            {step === 'login' ? <UserIcon size={40} /> : <Building2 size={40} />}
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white animate-bounce shadow-lg"></div>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Centralen</h1>
                    <p className="text-gray-500 font-medium">
                        {step === 'login' ? t('login.header.login', 'Log in to your personal control center') : t('login.header.select_workspace', 'Select a workspace')}
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-4xl shadow-[0_20px_50px_rgba(37,99,235,0.08)] border border-white relative overflow-hidden group">
                    {/* Subtle Progress Bar */}
                    {loading && (
                        <div className="absolute top-0 left-0 h-1 bg-blue-600 animate-[shimmer_2s_infinite]" style={{ width: '100%' }}></div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold animate-in shake duration-500">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-red-500 rounded-full shrink-0"></div>
                                <div>
                                    {error === 'not_activated' ? (
                                        <span>
                                            {t('login.error.not_activated', 'The account is not activated yet. Should we resend the email?')}
                                            {resendStatus === 'idle' && (
                                                <button
                                                    type="button"
                                                    onClick={handleResendActivation}
                                                    className="underline hover:text-red-800 focus:outline-none ml-1 cursor-pointer font-black"
                                                >
                                                    {t('register.resend.button', 'Resend activation link')}
                                                </button>
                                            )}
                                            {resendStatus === 'sending' && (
                                                <span className="text-gray-500 ml-1 font-medium italic animate-pulse">
                                                    {t('login.error.resending', 'Sending...')}
                                                </span>
                                            )}
                                            {resendStatus === 'sent' && (
                                                <span className="text-emerald-600 ml-1 font-black animate-in fade-in duration-300">
                                                    {t('login.error.resend_success', 'The activation link has been resent!')}
                                                </span>
                                            )}
                                            {resendStatus === 'failed' && (
                                                <button
                                                    type="button"
                                                    onClick={handleResendActivation}
                                                    className="underline hover:text-red-800 focus:outline-none ml-1 cursor-pointer font-black"
                                                >
                                                    {t('login.error.resend_failed', 'Could not resend the activation link. Please try again.')}
                                                </button>
                                            )}
                                        </span>
                                    ) : (
                                        <span>{error}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('login.email_label', 'E-mail')}</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within/input:text-blue-600 transition-colors">
                                        <UserIcon size={18} className="text-gray-400 group-focus-within/input:text-blue-600" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl leading-5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all font-medium"
                                        placeholder={t('login.email_placeholder', 'Enter your email')}
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('login.password_label', 'Password')}</label>
                                    <Link to="/forgot-password" style={{ textDecoration: 'none' }} className="text-[11px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider">
                                        {t('login.button.forgot_password', 'Forgot password?')}
                                    </Link>
                                </div>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within/input:text-blue-600 transition-colors">
                                        <Lock size={18} className="text-gray-400 group-focus-within/input:text-blue-600" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl leading-5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all font-medium"
                                        placeholder={t('login.password_placeholder', '••••••••')}
                                        required
                                        autoComplete="current-password"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-70 disabled:grayscale disabled:pointer-events-none group/btn"
                            >
                                {loading ? (
                                    <Loader2 size={24} className="animate-spin" />
                                ) : (
                                    <>
                                        <span>{t('login.button.login', 'Log in')}</span>
                                        <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <div className="pt-4 text-center space-y-2">
                                <p className="text-sm font-medium text-gray-400">
                                    {t('login.footer.no_account', 'New to Centralen? ')}
                                    <Link to="/register" className="text-blue-600 font-black hover:underline">
                                        {t('login.footer.register_here', 'Register your profile here')}
                                    </Link>
                                </p>
                                {email.trim() && (
                                    <p className="text-xs font-medium text-gray-400 animate-in fade-in duration-300">
                                        {t('login.footer.new_workspace', 'Need a new workspace? ')}
                                        <Link to="/request-workspace" className="text-blue-600 font-bold hover:underline">
                                            {t('login.footer.create_here', 'Create it here')}
                                        </Link>
                                    </p>
                                )}
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            {/* Pending Invitations Widget */}
                            {pendingInvitations.length > 0 && (
                                <div className="space-y-3 p-4 bg-emerald-50 border border-emerald-100 rounded-3xl text-left animate-in zoom-in-95 duration-300">
                                    <h3 className="text-xs font-black text-emerald-800 flex items-center gap-2">
                                        <Mail size={16} className="text-emerald-600 animate-bounce" />
                                        {t('login.invitations.title', 'You have pending invitations!')}
                                    </h3>
                                    <p className="text-[11px] text-gray-500 font-medium">
                                        {t('login.invitations.desc', 'You have been invited to join the following workspaces:')}
                                    </p>
                                    <div className="space-y-2 mt-1">
                                        {pendingInvitations.map((inv) => (
                                            <div key={inv.id} className="bg-white p-3 rounded-2xl border border-emerald-100/50 flex items-center justify-between gap-3 shadow-sm">
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-xs text-gray-800 truncate">{inv.company_name}</h4>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase truncate">
                                                        {inv.invited_by} • {t(`settings.invitations.role.${inv.role.toLowerCase()}`, inv.role)}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleAcceptInvitation(inv.id)}
                                                    disabled={loading}
                                                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-100 active:scale-95 transition-all shrink-0 cursor-pointer"
                                                >
                                                    {t('login.invitations.accept', 'Accept')}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {memberships.map((mem: WorkspaceMembership) => (
                                <button
                                    key={mem.id}
                                    onClick={() => selectWorkspace(mem.company.id)}
                                    disabled={loading}
                                    className="w-full p-4 bg-gray-50/50 hover:bg-white border border-gray-100 rounded-2xl flex items-center gap-4 transition-all hover:shadow-xl hover:border-blue-200 group/item text-left active:scale-[0.98]"
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg transition-transform group-hover/item:scale-110"
                                        style={{ backgroundColor: mem.color }}
                                    >
                                        {mem.company.navn.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900">{mem.company.navn}</h3>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{mem.role}</p>
                                    </div>
                                    <ArrowRight size={20} className="text-gray-300 group-hover/item:translate-x-1 group-hover/item:text-blue-500 transition-all" />
                                </button>
                            ))}

                            {memberships.length === 0 ? (
                                        <div className="text-center py-4">
                                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                                <Building2 size={32} />
                                            </div>
                                            <p className="text-gray-500 text-sm mb-2 font-medium">{t('login.workspace.none', 'You are not a member of any workspace yet.')}</p>
                                            <p className="text-gray-400 text-xs mb-6 font-medium">
                                                 {t('login.workspace.first_time_explanation', "To start, we need a workspace for you. Below, we've already pre-filled a personal name for your first workspace, which you can customize now (or rename at any time later).")}
                                             </p>
                                            
                                            <form onSubmit={handleCreateWorkspace} className="space-y-3 p-5 bg-gray-50/50 rounded-3xl border border-gray-100 text-left">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('workspace.create.title', 'Create new workspace')}</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newWorkspaceName}
                                                    onChange={e => setNewWorkspaceName(e.target.value)}
                                                    placeholder={t('workspace.create.placeholder', 'e.g. My Company')}
                                                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-gray-800"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!newWorkspaceName.trim() || workspaceSubmitting}
                                                    className="w-full py-3.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                                                >
                                                    {workspaceSubmitting ? <Loader2 size={16} className="animate-spin" /> : t('workspace.create.submit', 'Create workspace')}
                                                </button>
                                            </form>
                                        </div>
                                    ) : (
                                        <>
                                            {showDirectCreation ? (
                                                <div className="space-y-4 p-5 bg-gray-50/50 rounded-3xl border border-gray-100 text-left">
                                                    <h3 className="text-sm font-black text-gray-800 mb-1">{t('workspace.create.title', 'Create new workspace')}</h3>
                                                    <input
                                                        type="text"
                                                        value={newWorkspaceName}
                                                        onChange={e => setNewWorkspaceName(e.target.value)}
                                                        placeholder={t('workspace.create.placeholder', 'e.g. My Company')}
                                                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium mb-3"
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setShowDirectCreation(false)}
                                                            className="flex-1 py-3 text-xs font-bold text-gray-500 hover:bg-white border border-gray-100 rounded-2xl transition-colors"
                                                        >
                                                            {t('common.cancel', 'Cancel')}
                                                        </button>
                                                        <button
                                                            onClick={handleCreateWorkspace}
                                                            disabled={!newWorkspaceName.trim() || workspaceSubmitting}
                                                            className="flex-1 py-3 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            {workspaceSubmitting ? <Loader2 size={14} className="animate-spin" /> : t('workspace.create.submit', 'Create workspace')}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setShowDirectCreation(true)}
                                                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-bold hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Plus size={20} />
                                                    {t('login.workspace.create_new', 'Create new workspace')}
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {/* Collapsible Workspace Explanation Helper */}
                                    <div className="mt-6 border-t border-gray-100 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowHelp(!showHelp)}
                                            className="w-full flex items-center justify-between text-xs font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider py-1 cursor-pointer"
                                        >
                                            <span className="flex items-center gap-2">
                                                <HelpCircle size={14} />
                                                {t('workspace.help.title', 'Understand the structure')}
                                            </span>
                                            <span>{showHelp ? t('common.hide', 'Hide') : t('common.show', 'Show')}</span>
                                        </button>

                                        {showHelp && (
                                            <div className="mt-3 p-4 bg-blue-50/50 border border-blue-100/50 rounded-3xl text-left animate-in slide-in-from-top-2 duration-300">
                                                <ul className="space-y-2 text-[11px] font-medium text-gray-600">
                                                    <li>
                                                        <strong className="font-black text-gray-800">{t('workspace.help.workspace_label', 'Workspace:')}</strong> {t('workspace.help.workspace_desc', 'The top-level for the organization. All data is isolated per workspace.')}
                                                    </li>
                                                    <li>
                                                        <strong className="font-black text-gray-800">{t('workspace.help.teams_label', 'Teams:')}</strong> {t('workspace.help.teams_desc', 'Internal departments or workgroups within the workspace (e.g., Sales, Dev).')}
                                                    </li>
                                                    <li>
                                                        <strong className="font-black text-gray-800">{t('workspace.help.members_label', 'Members:')}</strong> {t('workspace.help.members_desc', 'Employees who have access to the workspace and can be assigned to roles/teams. A member can belong to different teams or organizations.')}
                                                    </li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 border-t border-gray-100 pt-2">
                                        <button
                                            onClick={logout}
                                            className="w-full py-3 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-red-500 transition-colors"
                                        >
                                            {t('login.button.logout', 'Log out')}
                                        </button>
                                    </div>
                        </div>
                    )}
                </div>

            </div>

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default LoginPage;
