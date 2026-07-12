import React, { useState } from 'react';
import { api } from '../api';
import { Lock, Loader2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from '../services/translationService';

const ResetPasswordPage: React.FC = () => {
    const { t } = useTranslation();
    const { token } = useParams<{ token: string }>();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password || !confirmPassword) return;

        if (password !== confirmPassword) {
            setError(t('register.error.password_match', 'Adgangskoderne stemmer ikke overens'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await api.post('/password-reset/reset/', {
                token,
                password
            });
            setSuccess(true);
        } catch (err: any) {
            console.error("Password reset update error:", err);
            const errCode = err.data?.code;
            if (errCode === 'invalid_token' || errCode === 'expired_token') {
                setError(t('password_reset.error.invalid_token', 'Nulstillingslinket er ugyldigt eller udløbet.'));
            } else {
                setError(err.data?.error || t('login.error.default', 'Der skete en fejl. Prøv igen.'));
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="h-screen bg-gray-300 flex flex-col p-6 overflow-y-auto">
                <div className="max-w-md w-full my-auto mx-auto bg-white/90 backdrop-blur-xl p-8 rounded-4xl shadow-2xl border border-white text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
                        <CheckCircle2 size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
                        {t('password_reset.reset.success_title', 'Adgangskode opdateret!')}
                    </h1>
                    <p className="text-gray-600 mb-8 font-medium leading-relaxed">
                        {t('password_reset.reset.success_desc', 'Din adgangskode er blevet opdateret. Du kan nu logge ind.')}
                    </p>
                    <Link 
                        to="/login" 
                        className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 px-6 rounded-2xl font-black text-sm hover:bg-blue-700 active:scale-[0.98] transition-all hover:shadow-2xl hover:shadow-blue-200"
                    >
                        <span>{t('login.button.login', 'Log ind')}</span>
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-300 flex flex-col p-6 overflow-y-auto">
            {/* Background Decorations */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-40 animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-md my-auto mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-2xl mx-auto mb-3 transform rotate-6">
                        <Lock size={28} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">
                        {t('password_reset.reset.title', 'Vælg ny adgangskode')}
                    </h1>
                    <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto">
                        {t('password_reset.reset.desc', 'Indtast og bekræft din nye adgangskode nedenfor.')}
                    </p>
                </div>

                <div className="bg-white/85 backdrop-blur-xl p-6 rounded-4xl shadow-2xl border border-white">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold animate-in shake duration-500 flex items-start gap-3">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                                {t('password_reset.reset.password_label', 'Ny adgangskode')}
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="block w-full pl-12 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all font-medium text-sm text-gray-900 placeholder-gray-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                                {t('password_reset.reset.confirm_label', 'Bekræft ny adgangskode')}
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="block w-full pl-12 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all font-medium text-sm text-gray-900 placeholder-gray-400"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !password || !confirmPassword}
                            className="w-full bg-blue-600 text-white py-3 rounded-2xl font-black text-base flex items-center justify-center gap-3 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : t('password_reset.reset.button', 'Opdater adgangskode')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
