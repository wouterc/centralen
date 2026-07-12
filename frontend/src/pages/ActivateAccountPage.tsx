import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAppState } from '../StateContext';
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../services/translationService';
import type { User, Team } from '../types';

const ActivateAccountPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { setState } = useAppState();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const activate = async () => {
            try {
                // Post to backend to activate
                const response = await api.post<{ status: string; user: User }>(`/activate-account/${token}/`);
                const user = response.user;

                // Check if user has memberships
                if (user.memberships && user.memberships.length > 0) {
                    const workspaceId = user.memberships[0].company.id;
                    localStorage.setItem('activeWorkspaceId', workspaceId);
                    
                    // Fetch state data for workspace
                    const users = await api.get<User[]>('/users/');
                    const teams = await api.get<Team[]>('/teams/');

                    setState(prev => ({
                        ...prev,
                        currentUser: user,
                        users,
                        teams,
                        activeWorkspaceId: workspaceId
                    }));
                    navigate('/board');
                } else {
                    // Logged in but no workspaces. Navigate to login where onboarding will handle it.
                    setState(prev => ({
                        ...prev,
                        currentUser: user,
                        activeWorkspaceId: null
                    }));
                    navigate('/login');
                }
            } catch (err: any) {
                console.error(err);
                const code = err.data?.code;
                const errorMessages: Record<string, string> = {
                    activation_link_expired: t('activate.error.expired', 'Aktiveringslinket er udløbet (maks. 24 timer).'),
                    activation_link_invalid: t('activate.error.invalid', 'Ugyldigt aktiveringslink.'),
                    user_not_found: t('activate.error.user_not_found', 'Brugeren blev ikke fundet.'),
                };
                setError((code && errorMessages[code]) || t('activate.error.failed', 'Aktiveringen fejlede. Linket kan være ugyldigt eller udløbet.'));
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            activate();
        }
    }, [token, navigate, setState, t]);

    if (loading) {
        return (
            <div className="h-screen bg-gray-300 flex flex-col p-6 overflow-y-auto">
                <div className="flex flex-col items-center gap-4 text-gray-800 my-auto mx-auto">
                    <Loader2 className="animate-spin text-blue-600" size={48} />
                    <p className="font-black animate-pulse text-lg">{t('activate.loading', 'Aktiverer din konto...')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen bg-gray-300 flex flex-col p-6 overflow-y-auto">
                <div className="max-w-md w-full my-auto mx-auto bg-white p-8 rounded-4xl shadow-xl text-center animate-in fade-in duration-300">
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">{t('activate.error_title', 'Aktivering mislykkedes')}</h1>
                    <p className="text-gray-500 mb-8 font-medium">{error}</p>
                    <Link 
                        to="/login" 
                        className="inline-flex items-center gap-2 text-blue-600 font-black hover:underline"
                    >
                        <ArrowLeft size={18} />
                        {t('activate.back_to_login', 'Gå til login')}
                    </Link>
                </div>
            </div>
        );
    }

    return null;
};

export default ActivateAccountPage;
