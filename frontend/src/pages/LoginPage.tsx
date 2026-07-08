import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAppState } from '../StateContext';
import { User as UserIcon, Lock, Loader2, ArrowRight, Building2, Plus } from 'lucide-react';
import { useTranslation } from '../services/translationService';
import type { User, Team, WorkspaceMembership } from '../types';

const LoginPage: React.FC = () => {
    const { setState } = useAppState();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'login' | 'select-workspace'>('login');
    const [tempUser, setTempUser] = useState<User | null>(null);

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
            setError(err.response?.data?.detail || err.message || t('login.error.default', 'Email eller adgangskode er forkert'));
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
            setError(t('login.error.select_workspace', 'Kunne ikke vælge arbejdsrum'));
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
        <div className="min-h-screen bg-gray-300 flex items-center justify-center p-6 overflow-y-auto">
            {/* Background Decorations */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-40 animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
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
                        {step === 'login' ? t('login.header.login', 'Log ind på dit personlige kontrolcenter') : t('login.header.select_workspace', 'Vælg et arbejdsrum')}
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-4xl shadow-[0_20px_50px_rgba(37,99,235,0.08)] border border-white relative overflow-hidden group">
                    {/* Subtle Progress Bar */}
                    {loading && (
                        <div className="absolute top-0 left-0 h-1 bg-blue-600 animate-[shimmer_2s_infinite]" style={{ width: '100%' }}></div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in shake duration-500">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            {error}
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
                                        placeholder={t('login.email_placeholder', 'Indtast din email')}
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('login.password_label', 'Adgangskode')}</label>
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
                                        <span>{t('login.button.login', 'Log ind')}</span>
                                        <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <div className="pt-4 text-center">
                                <p className="text-sm font-medium text-gray-400">
                                    {t('login.footer.new_workspace', 'Skal du bruge et nyt arbejdsrum? ')}
                                    <Link to="/request-workspace" className="text-blue-600 font-bold hover:underline">
                                        {t('login.footer.create_here', 'Opret det her')}
                                    </Link>
                                </p>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
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

                            {memberships.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                        <Building2 size={32} />
                                    </div>
                                    <p className="text-gray-500 text-sm mb-6">{t('login.workspace.none', 'Du er ikke medlem af nogen arbejdsrum endnu.')}</p>
                                </div>
                            )}

                            <div className="mt-6 flex flex-col gap-3">
                                <button
                                    onClick={() => navigate('/request-workspace')}
                                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-bold hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={20} />
                                    {t('login.workspace.create_new', 'Opret nyt arbejdsrum')}
                                </button>

                                <button
                                    onClick={logout}
                                    className="w-full py-3 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-red-500 transition-colors"
                                >
                                    {t('login.button.logout', 'Log ud')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <p className="mt-8 text-center text-gray-400 text-sm font-medium">
                    {t('login.footer.problems', 'Har du problemer med at logge ind?')} <br />
                    <span className="text-blue-500 font-bold hover:underline cursor-help">{t('login.footer.contact_admin', 'Kontakt din administrator')}</span>
                </p>
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
