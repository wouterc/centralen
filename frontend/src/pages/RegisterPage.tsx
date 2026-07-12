import React, { useState } from 'react';
import { api } from '../api';
import { Link } from 'react-router-dom';
import { User, Lock, Mail, Loader2, ArrowLeft, CheckCircle2, UserPlus } from 'lucide-react';
import { useTranslation } from '../services/translationService';
import LanguageSelector from '../components/LanguageSelector';

const RegisterPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    
    // Honeypot field for bot protection (should remain empty)
    const [website, setWebsite] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setErrorCode(null);
        setResendStatus('idle');

        try {
            await api.post('/register/', {
                username,
                email,
                password,
                first_name: firstName,
                last_name: lastName,
                language: i18n.language,
                website // Honeypot
            });
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            const code = err.data?.code as string | undefined;
            const errorMessages: Record<string, string> = {
                missing_fields: t('register.error.missing_fields', 'Brugernavn, e-mail og adgangskode skal angives.'),
                username_taken: t('register.error.username_taken', 'Brugernavnet er allerede i brug. Vælg et andet.'),
                email_taken: t('register.error.email_taken', 'Denne e-mailadresse har allerede en aktiv konto. Prøv at logge ind i stedet.'),
                email_pending_activation: t('register.error.email_pending_activation', 'Denne e-mailadresse er allerede registreret, men kontoen er endnu ikke aktiveret.'),
            };
            setErrorCode(code || null);
            setError((code && errorMessages[code]) || t('register.error.failed', 'Der skete en fejl under oprettelsen. Prøv igen.'));
        } finally {
            setLoading(false);
        }
    };

    const handleResendActivation = async () => {
        setResendStatus('sending');
        try {
            await api.post('/resend-activation/', { email });
            setResendStatus('sent');
        } catch (err) {
            console.error(err);
            setResendStatus('idle');
        }
    };

    if (success) {
        return (
            <div className="h-screen bg-gray-300 flex flex-col p-6 overflow-y-auto">
                <div className="max-w-md w-full my-auto mx-auto bg-white p-8 rounded-4xl shadow-xl text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-4">{t('register.success_title', 'Tjek din e-mail!')}</h1>
                    <p className="text-gray-600 mb-8 font-medium">
                        {t('register.success_message', 'Vi har sendt et aktiveringslink til {{email}}. Klik på linket i e-mailen for at aktivere din profil.', { email })}
                    </p>
                    <Link 
                        to="/login" 
                        className="inline-flex items-center gap-2 text-blue-600 font-black hover:underline"
                    >
                        <ArrowLeft size={18} />
                        {t('register.back_to_login', 'Tilbage til login')}
                    </Link>
                </div>
            </div>
        );
    }

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
                <div className="text-center mb-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-2xl mx-auto mb-3 transform hover:rotate-6 transition-transform cursor-default">
                        <UserPlus size={28} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">{t('register.title', 'Opret Bruger')}</h1>
                    <p className="text-sm text-gray-500 font-medium">{t('register.subtitle', 'Opret en profil på Centralen for at komme i gang')}</p>
                </div>

                {/* Register Card */}
                <div className="bg-white/85 backdrop-blur-xl p-6 rounded-4xl shadow-2xl border border-white relative overflow-hidden">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold animate-in shake duration-500">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0"></div>
                                {error}
                            </div>
                            {errorCode === 'email_pending_activation' && (
                                resendStatus === 'sent' ? (
                                    <p className="mt-2 pl-5 text-emerald-600 font-medium text-xs">
                                        {t('register.resend.sent', 'Der er sendt et nyt aktiveringslink til din e-mail.')}
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResendActivation}
                                        disabled={resendStatus === 'sending'}
                                        className="mt-2 ml-5 text-xs font-black text-blue-600 hover:underline disabled:opacity-50"
                                    >
                                        {resendStatus === 'sending'
                                            ? t('register.resend.sending', 'Sender...')
                                            : t('register.resend.button', 'Send aktiveringslink igen')}
                                    </button>
                                )
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* Honeypot field (hidden from humans) */}
                        <div className="hidden" aria-hidden="true">
                            <input
                                type="text"
                                name="website"
                                value={website}
                                onChange={e => setWebsite(e.target.value)}
                                placeholder="Do not fill this if you are human"
                                tabIndex={-1}
                                autoComplete="off"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('register.username_label', 'Brugernavn*')}</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder={t('register.username_placeholder', 'Vælg et brugernavn')}
                                    className="block w-full pl-12 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all font-medium text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('register.email_label', 'Din E-mail*')}</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="navn@firma.dk"
                                    className="block w-full pl-12 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all font-medium text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('register.first_name_label', 'Fornavn')}</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    placeholder={t('register.first_name_placeholder', 'Fornavn')}
                                    className="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all font-medium text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('register.last_name_label', 'Efternavn')}</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    placeholder={t('register.last_name_placeholder', 'Efternavn')}
                                    className="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all font-medium text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('register.password_label', 'Vælg en adgangskode*')}</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    minLength={6}
                                    className="block w-full pl-12 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all font-medium text-sm"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !username || !email || !password}
                            className="w-full bg-blue-600 text-white py-3 rounded-2xl font-black text-base flex items-center justify-center gap-3 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : t('register.button.submit', 'Opret min profil')}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                        <Link to="/login" className="text-gray-400 font-bold text-sm hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                            <ArrowLeft size={16} />
                            {t('register.back_to_login', 'Tilbage til login')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
