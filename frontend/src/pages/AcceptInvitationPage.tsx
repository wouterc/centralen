import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAppState } from '../StateContext';
import { Check, Loader2, Building2, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../services/translationService';

const AcceptInvitationPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { state } = useAppState();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [invitationInfo, setInvitationInfo] = useState<any>(null);

    const [formData, setFormData] = useState({
        first_name: state.currentUser?.first_name || '',
        last_name: state.currentUser?.last_name || '',
        password: '',
        confirm_password: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const isAlreadyLoggedInAsInvited = state.currentUser && state.currentUser.email === invitationInfo?.email;

    useEffect(() => {
        const fetchInvitation = async () => {
            try {
                const data = await api.get(`/accept-invitation/${token}/`);
                setInvitationInfo(data);
                setLoading(false);
            } catch (err: any) {
                setError(err.message || t('invitation.error.fetch_failed', 'Kunne ikke hente invitationen.'));
                setLoading(false);
            }
        };
        fetchInvitation();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAlreadyLoggedInAsInvited && formData.password !== formData.confirm_password) {
            setError(t('invitation.error.password_mismatch', 'Adgangskoderne er ikke ens.'));
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const response: any = await api.post(`/accept-invitation/${token}/`, formData);
            
            // Set the new workspace as active immediately
            if (response.company_id) {
                localStorage.setItem('activeWorkspaceId', response.company_id);
            }
            
            // On success, the API logs in the user (if not already), force reload to dashboard
            window.location.href = '/board';
        } catch (err: any) {
            setError(err.message || t('invitation.error.accept_failed', 'Kunne ikke acceptere invitationen.'));
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen bg-gray-300 flex flex-col p-4 overflow-y-auto">
                <div className="flex flex-col items-center gap-4 text-gray-800 my-auto mx-auto">
                    <Loader2 className="animate-spin text-blue-600" size={48} />
                    <p className="font-black animate-pulse">{t('invitation.loading', 'Henter din invitation...')}</p>
                </div>
            </div>
        );
    }

    if (error && !invitationInfo) {
        return (
            <div className="h-screen bg-linear-to-br from-red-900 via-red-800 to-red-950 flex flex-col p-4 overflow-y-auto">
                <div className="bg-white rounded-4xl p-8 max-w-md w-full my-auto mx-auto shadow-2xl text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center text-red-600 mx-auto mb-6">
                        < ShieldCheck size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">{t('invitation.error.invalid_title', 'Ugyldig invitation')}</h2>
                    <p className="text-gray-500 mb-8">{error}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black hover:bg-black transition-all"
                    >
                        {t('invitation.button.goto_login', 'Gå til Login')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-300 flex flex-col p-4 overflow-y-auto">
            <div className="bg-white rounded-4xl p-8 max-w-xl w-full my-auto mx-auto shadow-2xl relative overflow-hidden">

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">C</div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none uppercase">Centralen</h1>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{t('invitation.header.welcome', 'Velkommen ombord')}</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-3xl p-6 mb-8 border border-gray-100">
                        <p className="text-gray-500 text-sm mb-4">{t('invitation.info.invited_to', 'Du er blevet inviteret til at deltage i:')}</p>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-gray-100">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900">{invitationInfo.company_name}</h2>
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest">
                                    {invitationInfo.role}
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-4">
                            {t('invitation.info.email_hint', 'Log ind med din email:')} <span className="font-bold text-gray-600">{invitationInfo.email}</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isAlreadyLoggedInAsInvited ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('invitation.form.first_name', 'Fornavn')}</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.first_name}
                                            onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-5 py-4 outline-none transition-all font-bold text-gray-800"
                                            placeholder={t('invitation.form.first_name', 'Fornavn')}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('invitation.form.last_name', 'Efternavn')}</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.last_name}
                                            onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-5 py-4 outline-none transition-all font-bold text-gray-800"
                                            placeholder={t('invitation.form.last_name', 'Efternavn')}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('invitation.form.password', 'Vælg Adgangskode')}</label>
                                    <input
                                        required
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-5 py-4 outline-none transition-all font-bold text-gray-800"
                                        placeholder="******"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('invitation.form.confirm_password', 'Bekræft Adgangskode')}</label>
                                    <input
                                        required
                                        type="password"
                                        value={formData.confirm_password}
                                        onChange={e => setFormData({ ...formData, confirm_password: e.target.value })}
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-5 py-4 outline-none transition-all font-bold text-gray-800"
                                        placeholder="******"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 text-center animate-in fade-in zoom-in duration-500">
                                <p className="text-blue-700 font-bold mb-2">{t('invitation.form.already_logged_in', 'Du er allerede logget ind!')}</p>
                                <p className="text-blue-600/70 text-sm">{t('invitation.form.already_logged_in_hint', 'Klik på knappen herunder for at blive tilføjet til {{name}} med din nuværende konto.', { name: invitationInfo.company_name })}</p>
                            </div>
                        )}

                        {error && <p className="text-red-500 text-xs font-bold text-center mt-2">{error}</p>}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-blue-600 text-white rounded-2xl py-4 font-black flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 mt-4"
                        >
                            {submitting ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <Check size={20} />
                                    {t('invitation.button.accept', 'Accepter Invitation & Kom I Gang')}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AcceptInvitationPage;
