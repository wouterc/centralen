import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Plus, RefreshCw, ChevronLeft, ChevronRight, Target, RotateCcw, Users } from 'lucide-react';
import { aarshjulService, type Gruppe, type Aktivitet } from '../services/aarshjulService';
import { useAppState } from '../StateContext';
import Timeline from '../components/aarshjul/Timeline';
import AktivitetModal from '../components/aarshjul/AktivitetModal';
import dayjs from 'dayjs';
import { useTranslation } from '../services/translationService';

export interface LastAction {
    type: 'update' | 'create';
    id: number;
    previousData: Partial<Aktivitet>;
}

const AarshjulPage: React.FC = () => {
    const { state } = useAppState();
    const { t, i18n } = useTranslation();
    const [aktiviteter, setAktiviteter] = useState<Aktivitet[]>([]);
    const [grupper, setGrupper] = useState<Gruppe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAktivitet, setEditingAktivitet] = useState<Aktivitet | undefined>(undefined);
    const [viewStartDate, setViewStartDate] = useState(dayjs().startOf('year'));
    const [undoStack, setUndoStack] = useState<LastAction[]>([]);
    const [currentTeamId, setCurrentTeamId] = useState<number | null>(() => {
        const saved = localStorage.getItem('aarshjulTeamId');
        return saved !== null ? Number(saved) : 0;
    });

    useEffect(() => {
        if (currentTeamId !== null) {
            localStorage.setItem('aarshjulTeamId', currentTeamId.toString());
        }
    }, [currentTeamId]);

    const fetchData = async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const [aktData, groupData] = await Promise.all([
                aarshjulService.getAll(currentTeamId || undefined),
                aarshjulService.getAllGrupper(currentTeamId || undefined)
            ]);
            setAktiviteter(aktData);
            setGrupper(groupData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentTeamId]);

    const handleAktivitetClick = (akt: Aktivitet) => {
        setEditingAktivitet(akt);
        setIsModalOpen(true);
    };

    const handleNewAktivitet = () => {
        setEditingAktivitet(undefined);
        setIsModalOpen(true);
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setViewStartDate(prev => direction === 'prev' ? prev.subtract(1, 'month') : prev.add(1, 'month'));
    };

    const resetToToday = () => {
        setViewStartDate(dayjs().startOf('month'));
    };

    const handleUndo = async () => {
        if (undoStack.length === 0) return;

        const action = undoStack[undoStack.length - 1];
        setUndoStack(prev => prev.slice(0, -1));

        try {
            if (action.type === 'update') {
                await aarshjulService.update(action.id, action.previousData);
            } else if (action.type === 'create') {
                await aarshjulService.delete(action.id);
            }
            fetchData(true);
        } catch (error) {
            console.error('Fortryd fejlede:', error);
        }
    };

    const currentPeriodText = useMemo(() => {
        const start = viewStartDate.format('MMM YYYY');
        const end = viewStartDate.add(11, 'months').format('MMM YYYY');
        return `${start} - ${end}`;
    }, [viewStartDate, i18n.language]);

    return (
        <div className="h-full flex flex-col bg-slate-200 overflow-hidden">
            {/* Fancy Header */}
            <div className="bg-white/80 backdrop-blur-md px-8 py-5 shadow-[0_1px_24px_rgba(0,0,0,0.05)] border-b border-blue-50/50 flex items-center justify-between z-20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-lg shadow-blue-500/30">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none bg-clip-text">{t('calendar.title', 'Annual Calendar')}</h1>
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1.5 opacity-70">{t('calendar.subtitle', 'Annual overview of activities and deadlines.')}</p>
                        </div>
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200/50 ml-4">
                        <button
                            onClick={() => navigateMonth('prev')}
                            className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-600 transition-all active:scale-95"
                            title={t('aarshjul.prev_month', 'Previous Month')}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="px-4 py-1.5 min-w-[160px] text-center">
                            <span className="text-sm font-black text-slate-700 tabular-nums uppercase tracking-wide">
                                {currentPeriodText}
                            </span>
                        </div>
                        <button
                            onClick={() => navigateMonth('next')}
                            className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-600 transition-all active:scale-95"
                            title={t('aarshjul.next_month', 'Next Month')}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-2" />

                    {/* Team Filter */}
                    <div className="flex items-center gap-2 bg-slate-100/50 px-3 py-1.5 rounded-xl border border-slate-200/50">
                        <Users size={16} className="text-slate-400" />
                        <select
                            value={currentTeamId ?? 0}
                            onChange={(e) => setCurrentTeamId(Number(e.target.value))}
                            className="bg-transparent text-sm font-bold text-slate-600 outline-none cursor-pointer pr-2"
                        >
                            <option value={0}>{t('common.all_teams', 'ALL TEAMS')}</option>
                            {state.teams.map(team => (
                                <option key={team.id} value={team.id}>{team.navn}</option>
                            ))}
                        </select>
                    </div>

                    {undoStack.length > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="h-4 w-px bg-slate-200 mx-2" />
                            <button
                                onClick={handleUndo}
                                className="flex items-center gap-2 px-4 py-2 text-[11px] font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 uppercase tracking-wider relative overflow-hidden group/undo whitespace-nowrap"
                            >
                                <RotateCcw size={14} strokeWidth={3} className="group-hover/undo:-rotate-45 transition-transform" />
                                {t('aarshjul.undo', 'Undo ({{count}})', { count: undoStack.length })}
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={resetToToday}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-95 whitespace-nowrap"
                    >
                        <Target size={16} />
                        {t('aarshjul.today', 'Today')}
                    </button>
                    <button
                        onClick={() => fetchData()}
                        className={`p-2.5 rounded-xl border transition-all ${isLoading ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm'}`}
                        title={t('aarshjul.refresh_tooltip', 'Refresh data')}
                    >
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleNewAktivitet}
                        className="flex items-center gap-3 bg-linear-to-r from-blue-600 to-blue-500 text-white px-7 py-3 rounded-[20px] font-black shadow-[0_8px_20px_-4px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_24px_-4px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all whitespace-nowrap"
                    >
                        <Plus size={20} strokeWidth={3} />
                        {t('aarshjul.new_activity', 'New Activity')}
                    </button>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 p-8 overflow-hidden">
                <div className="h-full flex flex-col">
                    <div className="flex-1 bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden relative group">
                        {isLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('aarshjul.loading', 'Fetching activities...')}</p>
                                </div>
                            </div>
                        ) : (
                            <Timeline
                                aktiviteter={aktiviteter}
                                setAktiviteter={setAktiviteter}
                                grupper={grupper}
                                onAktivitetClick={handleAktivitetClick}
                                onRefresh={(silent?: boolean) => { fetchData(silent); }}
                                viewStartDate={viewStartDate}
                                onAction={(action) => setUndoStack(prev => action ? [...prev, action] : [])}
                            />
                        )}
                    </div>
                </div>
            </div>

            <AktivitetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                aktivitet={editingAktivitet}
                onSaved={() => fetchData()}
            />
        </div>
    );
};

export default AarshjulPage;
