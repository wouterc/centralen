import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, Plus } from 'lucide-react';
import type { Tidreg, BrugerProfilTime } from '../types/tidsregistrering';
import { api } from '../api';
import SetupView from '../components/tidsregistrering/SetupView';
import OverviewView from '../components/tidsregistrering/OverviewView';
import EditRegistrationModal from '../components/tidsregistrering/EditRegistrationModal';
import { Edit } from 'lucide-react';
import Toast, { type ToastType } from '../components/ui/Toast';

type View = 'dashboard' | 'setup' | 'overview';

// Helper component for active timer
const ActiveTimer: React.FC<{ startTime: string }> = ({ startTime }) => {
    const [elapsed, setElapsed] = useState('00:00:00');

    useEffect(() => {
        const update = () => {
            const start = new Date(startTime).getTime();
            const now = new Date().getTime();
            const diff = Math.max(0, Math.floor((now - start) / 1000));
            const h = Math.floor(diff / 3600).toString().padStart(2, '0');
            const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');
            setElapsed(`${h}:${m}:${s}`);
        };
        update();
        const i = setInterval(update, 1000);
        return () => clearInterval(i);
    }, [startTime]);

    return <span>{elapsed}</span>;
};

const TidsregistreringPage: React.FC = () => {
    const [view, setView] = useState<View>('dashboard');
    const [registreringer, setRegistreringer] = useState<Tidreg[]>([]);
    const [profiler, setProfiler] = useState<BrugerProfilTime[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingReg, setEditingReg] = useState<Tidreg | null>(null);

    const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
        message: '',
        type: 'info',
        isVisible: false
    });

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type, isVisible: true });
    };

    const fetchData = useCallback(async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {
            const [regData, profData] = await Promise.all([
                api.get<Tidreg[]>('/tidsregistrering/registreringer/'),
                api.get<BrugerProfilTime[]>('/tidsregistrering/profiler/')
            ]);
            setRegistreringer(regData);
            setProfiler(profData);
        } catch (error) {
            console.error('Data error:', error);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(true);
    }, [fetchData]);

    const activeRegistration = useMemo(() =>
        registreringer.find(r => r.til_tid === null),
        [registreringer]);

    const handleTaskToggle = async (profil: BrugerProfilTime) => {
        const isCurrentlyActive = activeRegistration &&
            activeRegistration.opgave_kode === profil.opgave_kode &&
            activeRegistration.alias === profil.alias;

        if (isCurrentlyActive) {
            // Stop current
            const endTime = new Date();
            const start = new Date(activeRegistration.fra_tid);
            const diff = Math.max(0, Math.floor((endTime.getTime() - start.getTime()) / 1000));
            const h = Math.floor(diff / 3600).toString().padStart(2, '0');
            const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');

            try {
                await api.patch(`/tidsregistrering/registreringer/${activeRegistration.id}/`, {
                    til_tid: endTime.toISOString(),
                    tid: `${h}:${m}:${s}`,
                    aktiv: false
                });
                fetchData();
            } catch (e) { showToast('Fejl ved stop', 'error'); }
        } else {
            // Stop existing if any
            if (activeRegistration) {
                const endTime = new Date();
                const start = new Date(activeRegistration.fra_tid);
                const diff = Math.max(0, Math.floor((endTime.getTime() - start.getTime()) / 1000));
                const tid = `${Math.floor(diff / 3600).toString().padStart(2, '0')}:${Math.floor((diff % 3600) / 60).toString().padStart(2, '0')}:${(diff % 60).toString().padStart(2, '0')}`;
                await api.patch(`/tidsregistrering/registreringer/${activeRegistration.id}/`, {
                    til_tid: endTime.toISOString(),
                    tid: tid,
                    aktiv: false
                });
            }
            // Start new
            try {
                await api.post('/tidsregistrering/registreringer/', {
                    opgave_kode: profil.opgave_kode,
                    alias: profil.alias,
                    fra_tid: new Date().toISOString(),
                    aktiv: true
                });
                fetchData();
            } catch (e) { showToast('Fejl ved start', 'error'); }
        }
    };

    const handleEditClick = (e: React.MouseEvent, profil: BrugerProfilTime) => {
        e.stopPropagation();
        // Find most recent registration for this profile
        const sorted = [...registreringer]
            .filter(r => r.opgave_kode === profil.opgave_kode && r.alias === profil.alias)
            .sort((a, b) => new Date(b.fra_tid).getTime() - new Date(a.fra_tid).getTime());

        if (sorted.length > 0) {
            setEditingReg(sorted[0]);
        } else {
            showToast('Ingen tidligere registreringer fundet for denne opgave.', 'error');
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-300 font-sans">
            {/* Toolbar Area */}
            <div className="bg-white px-8 py-4 shadow-sm z-10 flex flex-wrap gap-4 items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Clock className="text-blue-600" size={24} />
                            Tidshusker
                        </h1>
                        <p className="text-xs text-gray-500">Tidsregistrering og overblik</p>
                    </div>

                    <nav className="flex bg-gray-100 rounded-xl p-1 gap-1 border border-gray-200">
                        <button
                            onClick={() => setView('dashboard')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${view === 'dashboard' ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            ⏱️ Tid
                        </button>
                        <button
                            onClick={() => setView('setup')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${view === 'setup' ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            ⚙️ Opsætning
                        </button>
                        <button
                            onClick={() => setView('overview')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${view === 'overview' ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            📊 Oversigt
                        </button>
                    </nav>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto p-8 bg-gray-300 custom-scrollbar">
                <div className="max-w-7xl mx-auto">
                    {loading && (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                            <span className="font-bold text-sm uppercase tracking-widest">Henter dine opgaver...</span>
                        </div>
                    )}

                    {!loading && view === 'dashboard' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {profiler.map(profil => {
                                const isActive = activeRegistration &&
                                    activeRegistration.opgave_kode === profil.opgave_kode &&
                                    activeRegistration.alias === profil.alias;

                                const latestReg = [...registreringer]
                                    .filter(r => r.opgave_kode === profil.opgave_kode && r.alias === profil.alias)
                                    .sort((a, b) => new Date(b.fra_tid).getTime() - new Date(a.fra_tid).getTime())[0];

                                return (
                                    <div
                                        key={profil.id}
                                        onClick={() => handleTaskToggle(profil)}
                                        className={`p-4 rounded-xl flex flex-col justify-between transition-all cursor-pointer group relative overflow-hidden h-[120px] shadow-sm border
                                            ${isActive
                                                ? 'bg-white border-t-4 border-t-emerald-500 scale-[1.01] shadow-emerald-100 shadow-lg'
                                                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
                                            }`}
                                    >
                                        <div className="z-10 w-full">
                                            <h3 className={`font-bold text-sm leading-tight line-clamp-1 ${isActive ? 'text-gray-800' : 'text-gray-700 group-hover:text-blue-600'}`}>
                                                {profil.alias || profil.beskrivelse}
                                            </h3>
                                        </div>

                                        <div className="z-10 flex items-center justify-between">
                                            <button
                                                onClick={(e) => handleEditClick(e, profil)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-all"
                                                title="Ret tid"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <span className={`text-2xl font-bold tabular-nums transition-colors ${isActive ? 'text-emerald-600' : 'text-gray-300'}`}>
                                                {isActive ? (
                                                    <ActiveTimer startTime={activeRegistration.fra_tid} />
                                                ) : (
                                                    latestReg?.tid || '--:--:--'
                                                )}
                                            </span>
                                        </div>

                                        <div className="z-10 flex items-center justify-between">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{profil.kode_nr}</p>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                    {isActive ? 'Aktiv' : (latestReg ? 'Sidst registreret' : 'Klar')}
                                                </span>
                                                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-200'}`} />
                                            </div>
                                        </div>

                                        {isActive && <div className="absolute inset-0 bg-emerald-50/10 pointer-events-none" />}
                                    </div>
                                );
                            })}

                            {profiler.length === 0 && (
                                <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
                                    <div className="text-gray-300 mb-4 flex justify-center"><Plus size={48} /></div>
                                    <h3 className="text-gray-500 font-bold text-xl mb-2">Ingen favoritter endnu</h3>
                                    <p className="text-gray-400 text-sm font-semibold max-w-xs mx-auto">Gå til "Opsætning" for at tilføje dine mest brugte opgavekoder til din oversigt.</p>
                                    <button
                                        onClick={() => setView('setup')}
                                        className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                                    >
                                        OPSÆT NU
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {!loading && view === 'setup' && (
                        <SetupView favorites={profiler} onRefresh={fetchData} />
                    )}

                    {!loading && view === 'overview' && (
                        <OverviewView />
                    )}

                    <EditRegistrationModal
                        isOpen={!!editingReg}
                        onClose={() => setEditingReg(null)}
                        registration={editingReg}
                        onSave={() => fetchData()}
                    />
                </div>
            </main>

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    );
};

export default TidsregistreringPage;
