import React, { useState } from 'react';
import { api } from '../api';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../services/translationService';

const ForgotPasswordPage: React.FC = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        setError(null);

        try {
            await api.post('/password-reset/request/', { email: email.trim() });
            setSuccess(true);
        } catch (err: any) {
            console.error("Password reset error:", err);
            setError(err.data?.error || t('login.error.default', 'Der skete en fejl. Prøv igen.'));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="h-screen bg-gray-300 flex flex-col p-6 overflow-y-auto">
                <div className="max-w-md w-full my-auto mx-auto bg-white/90 backdrop-blur-xl p-8 rounded-4xl shadow-2xl border border-white text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <CheckCircle2 size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
                        {t('password_reset.request.success_title', 'E-mail sendt!')}
                    </h1>
                    <p className="text-gray-600 mb-8 font-medium leading-relaxed">
                        {t('password_reset.request.success_desc', 'Hvis denne e-mail er registreret i vores system, vil du modtage instruktioner inden længe.')}
                    </p>
                    <Link 
                        to="/login" 
                        className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 px-6 rounded-2xl font-black text-sm hover:bg-blue-700 active:scale-[0.98] transition-all hover:shadow-2xl hover:shadow-blue-200"
                    >
                        <ArrowLeft size={16} />
                        {t('request_workspace.back_to_login', 'Tilbage til login')}
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
                        <Mail size={28} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">
                        {t('password_reset.request.title', 'Nulstil adgangskode')}
                    </h1>
                    <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto">
                        {t('password_reset.request.desc', 'Indtast din e-mailadresse, og vi vil sende dig et link til at nulstille din adgangskode.')}
                    </p>
                </div>

                <div className="bg-white/85 backdrop-blur-xl p-6 rounded-4xl shadow-2xl border border-white">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold animate-in shake duration-500">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                                {t('login.email_label', 'E-mail')}
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="navn@firma.dk"
                                    className="block w-full pl-12 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all font-medium text-sm text-gray-900 placeholder-gray-400"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full bg-blue-600 text-white py-3 rounded-2xl font-black text-base flex items-center justify-center gap-3 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : t('password_reset.request.button', 'Send nulstillingslink')}
                        </button>
                    </form>

                    <div className="mt-4 border-t border-gray-100 pt-4 text-center">
                        <Link to="/login" className="text-gray-400 font-bold text-xs uppercase tracking-wider hover:text-blue-600 transition-colors inline-flex items-center gap-2">
                            <ArrowLeft size={14} />
                            {t('request_workspace.back_to_login', 'Tilbage til login')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
