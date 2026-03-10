import React, { useState } from 'react';
import { api } from '../api';
import { useAppState } from '../StateContext';
import { User, Lock, Loader2, ArrowRight } from 'lucide-react';

const LoginPage: React.FC = () => {
    const { setState } = useAppState();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // POST to Django's login endpoint
            await api.post('/login/', { username, password });

            // If success, refresh the app state to get the user
            const currentUser = await api.get<any>('/users/me/');
            const users = await api.get<any[]>('/users/');
            const teams = await api.get<any[]>('/teams/');

            setState(prev => ({
                ...prev,
                currentUser,
                users,
                teams
            }));

            // Navigation will happen naturally as StateContext updates and App.tsx re-renders
        } catch (err: any) {
            console.error("Login fejl:", err);
            setError(err.message || 'Brugernavn eller adgangskode er forkert');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 flex items-center justify-center p-6 bg-fixed">
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
                            C
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white animate-bounce shadow-lg"></div>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Centralen</h1>
                    <p className="text-gray-500 font-medium">Log ind på dit personlige kontrolcenter</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(37,99,235,0.08)] border border-white relative overflow-hidden group">
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

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Brugernavn</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within/input:text-blue-600 transition-colors">
                                    <User size={18} className="text-gray-400 group-focus-within/input:text-blue-600" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl leading-5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all font-medium"
                                    placeholder="Indtast brugernavn"
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Adgangskode</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within/input:text-blue-600 transition-colors">
                                    <Lock size={18} className="text-gray-400 group-focus-within/input:text-blue-600" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl leading-5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all font-medium"
                                    placeholder="••••••••"
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
                                    <span>Log ind</span>
                                    <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Info */}
                <p className="mt-8 text-center text-gray-400 text-sm font-medium">
                    Har du problemer med at logge ind? <br />
                    <span className="text-blue-500 font-bold hover:underline cursor-help">Kontakt din administrator</span>
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
