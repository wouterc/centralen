import React, { useState } from 'react';
import { api } from '../api';
import { Building2, Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../services/translationService';

const RequestWorkspacePage: React.FC = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.post('/workspace-requests/', {
                email,
                company_name: companyName
            });
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || t('common.error_generic', 'Der skete en fejl. Prøv igen senere.'));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-300 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white p-8 rounded-4xl shadow-xl text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-4">{t('request_workspace.success_title', 'Forespørgsel sendt!')}</h1>
                    <p className="text-gray-600 mb-8 font-medium">
                        {t('request_workspace.success_message', 'Vi har sendt et bekræftelseslink til {{email}}. Klik på linket i e-mailen for at færdiggøre oprettelsen af dit arbejdsrum.', { email })}
                    </p>
                    <Link 
                        to="/login" 
                        className="inline-flex items-center gap-2 text-blue-600 font-black hover:underline"
                    >
                        <ArrowLeft size={18} />
                        {t('request_workspace.back_to_login', 'Tilbage til login')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-300 flex items-center justify-center p-6">
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-4xl shadow-2xl mx-auto mb-6 transform rotate-6">
                        <Building2 size={40} />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">{t('request_workspace.title', 'Nyt Arbejdsrum')}</h1>
                    <p className="text-gray-500 font-medium">{t('request_workspace.subtitle', 'Start din rejse med Centralen i dag')}</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-4xl shadow-2xl border border-white">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold animate-in shake duration-500">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('request_workspace.email_label', 'Din E-mail')}</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="navn@firma.dk"
                                    className="block w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('request_workspace.company_name_label', 'Arbejdsrummets Navn')}</label>
                            <div className="relative group">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                    placeholder="F.eks. Mit Super Team"
                                    className="block w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all font-medium"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email || !companyName}
                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : t('request_workspace.continue', 'Fortsæt til bekræftelse')}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                        <Link to="/login" className="text-gray-400 font-bold text-sm hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                            <ArrowLeft size={16} />
                            {t('request_workspace.back_to_login', 'Tilbage til login')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestWorkspacePage;
