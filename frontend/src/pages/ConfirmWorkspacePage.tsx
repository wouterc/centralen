import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAppState } from '../StateContext';
import { Building2, Lock, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import { useTranslation } from '../services/translationService';

const ConfirmWorkspacePage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { setState } = useAppState();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [requestInfo, setRequestInfo] = useState<{
        email: string;
        company_name: string;
        user_exists: boolean;
    } | null>(null);

    // Form states for new user
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const info = await api.get<{ email: string; company_name: string; user_exists: boolean }>(`/workspace-requests/confirm/${token}/`);
                setRequestInfo(info);
            } catch (err: any) {
                console.error(err);
                setError(err.message || t('confirm.error.invalid', 'Ugyldigt eller udløbet link.'));
            } finally {
                setLoading(false);
            }
        };
        fetchInfo();
    }, [token]);

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const result = await api.post<{ workspace_id: string }>(`/workspace-requests/confirm/${token}/`, {
                first_name: firstName,
                last_name: lastName,
                password: password
            });

            // If success, we are logged in. Initialize app state.
            localStorage.setItem('activeWorkspaceId', result.workspace_id);
            
            // Full refresh logic similar to LoginPage
            const currentUser = await api.get<any>('/users/me/');
            const users = await api.get<any[]>('/users/');
            const teams = await api.get<any[]>('/teams/');

            setState(prev => ({
                ...prev,
                currentUser,
                users,
                teams,
                activeWorkspaceId: result.workspace_id
            }));

            // Force a hard reload to ensure all state and memberships are correctly loaded
            window.location.href = '/board';
        } catch (err: any) {
            console.error(err);
            setError(err.message || t('confirm.error.create_failed', 'Kunne ikke oprette arbejdsrum. Prøv igen.'));
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen bg-gray-300 flex flex-col p-6 overflow-y-auto">
                <div className="my-auto mx-auto">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                </div>
            </div>
        );
    }

    if (error || !requestInfo) {
        return (
            <div className="h-screen bg-gray-300 flex flex-col p-6 overflow-y-auto">
                <div className="max-w-md w-full my-auto mx-auto bg-white p-8 rounded-4xl shadow-xl text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={32} className="rotate-45" /> 
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">{t('common.whoops', 'Hovsa!')}</h1>
                    <p className="text-gray-500 mb-8 font-medium">{error}</p>
                    <button onClick={() => navigate('/login')} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black transition-all hover:bg-blue-700">
                        {t('common.back_to_login', 'Tilbage til login')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-300 flex flex-col p-6 overflow-y-auto">
            <div className="w-full max-w-xl my-auto mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-black text-4xl shadow-2xl mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">{t('confirm.header.title', 'Velkommen!')}</h1>
                    <p className="text-gray-500 font-medium">{t('confirm.header.subtitle', 'Vi er næsten klar til at oprette {{name}}', { name: requestInfo.company_name })}</p>
                </div>

                <div className="bg-white p-10 rounded-5xl shadow-2xl border border-gray-100">
                    <div className="flex items-center gap-4 mb-10 p-4 bg-gray-50 rounded-3xl">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-600">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('confirm.info.workspace', 'Arbejdsrum')}</p>
                            <p className="text-lg font-black text-gray-900 leading-none">{requestInfo.company_name}</p>
                        </div>
                        <div className="ml-auto text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('confirm.info.email', 'E-mail')}</p>
                            <p className="font-bold text-gray-700 leading-none">{requestInfo.email}</p>
                        </div>
                    </div>

                    <form onSubmit={handleConfirm} className="space-y-6">
                        {requestInfo.user_exists ? (
                            <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl text-blue-900 font-medium">
                                <p className="mb-2">{t('confirm.user_exists.title', 'Vi kan se, at du allerede har en konto hos os.')}</p>
                                <p className="text-sm opacity-80">{t('confirm.user_exists.subtitle', 'Klik på knappen nedenfor for at tilføje dette nye arbejdsrum til din eksisterende profil.')}</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('confirm.form.first_name', 'Fornavn')}</label>
                                        <input
                                            required
                                            type="text"
                                            value={firstName}
                                            onChange={e => setFirstName(e.target.value)}
                                            className="block w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 focus:bg-white transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('confirm.form.last_name', 'Efternavn')}</label>
                                        <input
                                            required
                                            type="text"
                                            value={lastName}
                                            onChange={e => setLastName(e.target.value)}
                                            className="block w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 focus:bg-white transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('confirm.form.password', 'Vælg en adgangskode')}</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                        <input
                                            required
                                            type="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 focus:bg-white transition-all font-medium"
                                            placeholder={t('confirm.form.password_placeholder', 'Mindst 6 tegn')}
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-xl flex items-center justify-center gap-3 hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-200 active:scale-[0.98] transition-all"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : (
                                <>
                                    {requestInfo.user_exists 
                                      ? t('confirm.button.confirm_exists', 'Bekræft & Opret Arbejdsrum') 
                                      : t('confirm.button.finish', 'Færdiggør Oprettelse')}
                                    <ChevronRight size={24} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ConfirmWorkspacePage;
