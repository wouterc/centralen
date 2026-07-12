import React, { useState } from 'react';
import { api } from '../api';
import { Building2, Mail, Loader2, ArrowLeft, CheckCircle2, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../services/translationService';

const RequestWorkspacePage: React.FC = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [showHelp, setShowHelp] = useState(false);
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
            setError(err.message || t('common.error_generic', 'Der skete en fejl. Prøv igen senere.'));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="h-screen bg-gray-300 flex flex-col p-6 overflow-y-auto">
                <div className="max-w-md w-full my-auto mx-auto bg-white p-8 rounded-4xl shadow-xl text-center animate-in fade-in zoom-in duration-500">
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
        <div className="h-screen bg-gray-300 flex flex-col p-6 overflow-y-auto">
            <div className="relative z-10 w-full max-w-4xl flex flex-col md:flex-row gap-6 items-center justify-center my-auto mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                
                {/* Left/Main Column: Form */}
                <div className="w-full max-w-md shrink-0">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-2xl mx-auto mb-3 transform rotate-6">
                            <Building2 size={28} />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">{t('request_workspace.title', 'Nyt Arbejdsrum')}</h1>
                        <p className="text-sm text-gray-500 font-medium">{t('request_workspace.subtitle', 'Start din rejse med Centralen i dag')}</p>
                    </div>

                    <div className="bg-white/85 backdrop-blur-xl p-6 rounded-4xl shadow-2xl border border-white">
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold animate-in shake duration-500">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('request_workspace.email_label', 'Din E-mail')}</label>
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

                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('request_workspace.company_name_label', 'Arbejdsrummets Navn')}</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                        placeholder="F.eks. Mit Super Team"
                                        className="block w-full pl-12 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all font-medium text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email || !companyName}
                                className="w-full bg-blue-600 text-white py-3 rounded-2xl font-black text-base flex items-center justify-center gap-3 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-200 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : t('request_workspace.continue', 'Fortsæt til bekræftelse')}
                            </button>
                        </form>

                        <div className="mt-4 border-t border-gray-100 pt-4 flex items-center justify-between">
                            <Link to="/login" className="text-gray-400 font-bold text-xs uppercase tracking-wider hover:text-blue-600 transition-colors flex items-center gap-2">
                                <ArrowLeft size={14} />
                                {t('request_workspace.back_to_login', 'Tilbage til login')}
                            </Link>

                            <button
                                type="button"
                                onClick={() => setShowHelp(!showHelp)}
                                className="flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider cursor-pointer"
                            >
                                <HelpCircle size={14} />
                                {showHelp ? t('common.hide', 'Skjul') : t('common.show', 'Vis')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Collapsible Help Block (displayed next to the form) */}
                {showHelp && (
                    <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl p-5 rounded-4xl shadow-2xl border border-white md:self-stretch flex flex-col justify-center animate-in slide-in-from-left-4 fade-in duration-300">
                        <h4 className="font-black text-blue-700 mb-4 uppercase tracking-wider text-[11px] flex items-center gap-2 border-b border-blue-50 pb-2">
                            <HelpCircle size={16} />
                            {t('workspace.help.title', 'Forstå opbygningen')}
                        </h4>
                        <ul className="space-y-3 text-[11px] font-medium text-gray-600">
                            <li>
                                <strong className="font-black text-gray-800 block mb-0.5">{t('workspace.help.workspace_label', 'Arbejdsrum:')}</strong> 
                                <span className="text-gray-500 leading-relaxed">{t('workspace.help.workspace_desc', 'Det overordnede niveau for virksomheden. Data er 100% adskilt mellem arbejdsrum.')}</span>
                            </li>
                            <li>
                                <strong className="font-black text-gray-800 block mb-0.5">{t('workspace.help.teams_label', 'Teams:')}</strong> 
                                <span className="text-gray-500 leading-relaxed">{t('workspace.help.teams_desc', 'Interne afdelinger eller arbejdsgrupper i arbejdsrummet (f.eks. Udvikling, Salg).')}</span>
                            </li>
                            <li>
                                <strong className="font-black text-gray-800 block mb-0.5">{t('workspace.help.members_label', 'Medlemmer:')}</strong> 
                                <span className="text-gray-500 leading-relaxed">{t('workspace.help.members_desc', 'Medarbejdere, som har adgang til arbejdsrummet og kan tildeles roller og teams.')}</span>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RequestWorkspacePage;
