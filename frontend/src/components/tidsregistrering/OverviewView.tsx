import React, { useState, useEffect, useMemo } from 'react';
import { Download, Calendar, Edit, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import type { Tidreg } from '../../types/tidsregistrering';
import { api } from '../../api';
import EditRegistrationModal from './EditRegistrationModal';
import { useTranslation } from '../../services/translationService';

interface OverviewViewProps {
    isAdmin: boolean;
}

const OverviewView: React.FC<OverviewViewProps> = ({ isAdmin: _isAdmin }) => {
    const { t } = useTranslation();
    
    // Utilities
    const getWeekNumber = (d: Date) => {
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return weekNo;
    };

    const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('da-DK', { day: '2-digit', month: 'short' });
    };

    const getWeekRange = (week: number, year: number) => {
        const jan4 = new Date(year, 0, 4);
        const dayOfWeek = jan4.getDay() || 7;
        const monday1 = new Date(jan4);
        monday1.setDate(jan4.getDate() - dayOfWeek + 1);

        const start = new Date(monday1);
        start.setDate(monday1.getDate() + (week - 1) * 7);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        return {
            start: formatDate(start),
            end: formatDate(end)
        };
    };

    const changeWeek = (delta: number) => {
        const { start } = getWeekRange(tempWeek, tempYear);
        const currentMonday = new Date(start);
        currentMonday.setDate(currentMonday.getDate() + (delta * 7));

        const newYear = currentMonday.getFullYear();
        const newWeek = getWeekNumber(currentMonday);

        let targetYear = newYear;
        if (newWeek === 1 && currentMonday.getMonth() === 11) {
            targetYear = newYear + 1;
        } else if (newWeek >= 52 && currentMonday.getMonth() === 0) {
            targetYear = newYear - 1;
        }

        setTempYear(targetYear);
        setTempWeek(newWeek);
        setYear(targetYear);
        setWeek(newWeek);
    };

    const minToHHMM = (minutes: number) => {
        if (minutes === 0) return '00:00';
        const h = Math.floor(minutes / 60);
        const m = Math.round(minutes % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const minToDecimal = (minutes: number) => {
        if (minutes === 0) return '0,00';
        return (minutes / 60).toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const timeToMinutes = (tid: string | null) => {
        if (!tid) return 0;
        const parts = tid.split(':').map(val => parseFloat(val) || 0);
        if (parts.length < 2) return 0;

        let mins = parts[0] * 60 + parts[1];
        if (parts.length >= 3) {
            mins += parts[2] / 60;
        }
        return mins;
    };

    // States
    const [activeTab, setActiveTab] = useState<'weekly' | 'period'>('weekly');
    const [registrations, setRegistrations] = useState<Tidreg[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingReg, setEditingReg] = useState<Tidreg | null>(null);
    const [showAllUsers, setShowAllUsers] = useState(false);

    // Weekly Filter
    const [week, setWeek] = useState(getWeekNumber(new Date()));
    const [year, setYear] = useState(new Date().getFullYear());
    const [tempWeek, setTempWeek] = useState(week);
    const [tempYear, setTempYear] = useState(year);

    // Period Filter
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [tempStartDate, setTempStartDate] = useState(startDate);
    const [tempEndDate, setTempEndDate] = useState(endDate);

    const hasPendingChanges = useMemo(() => {
        if (activeTab === 'weekly') {
            return tempWeek !== week || tempYear !== year;
        } else {
            return tempStartDate !== startDate || tempEndDate !== endDate;
        }
    }, [activeTab, tempWeek, week, tempYear, year, tempStartDate, startDate, tempEndDate, endDate]);

    const handleApplyFilters = () => {
        if (activeTab === 'weekly') {
            setWeek(tempWeek);
            setYear(tempYear);
        } else {
            setStartDate(tempStartDate);
            setEndDate(tempEndDate);
        }
    };

    const fetchData = React.useCallback(async (start: string, end: string) => {
        if (!start || !end) return;
        setLoading(true);
        try {
            const params: Record<string, any> = {
                fra_tid__gte: start,
                fra_tid__lte: end + 'T23:59:59'
            };
            if (showAllUsers) {
                params.all_users = 'true';
            }
            const res = await api.get<Tidreg[]>('/tidsregistrering/registreringer/', {
                params
            });
            setRegistrations(res);
        } catch (e) {
            console.error('Fetch error:', e);
        } finally {
            setLoading(false);
        }
    }, [showAllUsers]);

    // Initial setup or when switching tabs
    useEffect(() => {
        if (activeTab === 'weekly') {
            setWeek(tempWeek);
            setYear(tempYear);
            const { start, end } = getWeekRange(tempWeek, tempYear);
            setStartDate(start);
            setEndDate(end);
            setTempStartDate(start);
            setTempEndDate(end);
            fetchData(start, end);
        } else {
            setStartDate(tempStartDate);
            setEndDate(tempEndDate);
            fetchData(tempStartDate, tempEndDate);
        }
    }, [activeTab, fetchData]);

    // React to changes to active values
    useEffect(() => {
        if (activeTab === 'weekly') {
            const { start, end } = getWeekRange(week, year);
            setStartDate(start);
            setEndDate(end);
            setTempStartDate(start);
            setTempEndDate(end);
            fetchData(start, end);
        } else {
            fetchData(startDate, endDate);
        }
    }, [week, year, startDate, endDate, activeTab, fetchData]);

    const processedWeekly = useMemo(() => {
        const map = new Map<string, any>();
        registrations.forEach(reg => {
            const key = `${reg.kode_nr}-${reg.mtime}-${reg.gruppe}`;
            if (!map.has(key)) {
                map.set(key, {
                    mtime: reg.mtime || '',
                    gruppe: reg.gruppe || '',
                    beskrivelse: reg.beskrivelse || reg.alias || '',
                    kode_nr: reg.kode_nr,
                    days: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
                    total: 0
                });
            }
            const item = map.get(key);
            const date = new Date(reg.fra_tid);
            const day = date.getDay() || 7; 
            const mins = timeToMinutes(reg.tid);
            item.days[day] += mins;
            item.total += mins;
        });

        return Array.from(map.values()).sort((a, b) => {
            if (a.gruppe !== b.gruppe) return (a.gruppe || '').localeCompare(b.gruppe || '');
            return (a.kode_nr || '').localeCompare(b.kode_nr || '');
        });
    }, [registrations]);

    const processedAllUsers = useMemo(() => {
        const map = new Map<string, any>();
        registrations.forEach(reg => {
            const key = `${reg.bruger_name}-${reg.kode_nr}-${reg.gruppe}`;
            if (!map.has(key)) {
                map.set(key, {
                    bruger_name: reg.bruger_name || '',
                    gruppe: reg.gruppe || '',
                    beskrivelse: reg.beskrivelse || reg.alias || '',
                    kode_nr: reg.kode_nr,
                    total: 0
                });
            }
            const item = map.get(key);
            const mins = timeToMinutes(reg.tid);
            item.total += mins;
        });

        return Array.from(map.values()).sort((a, b) => {
            if (a.bruger_name !== b.bruger_name) return a.bruger_name.localeCompare(b.bruger_name);
            if (a.gruppe !== b.gruppe) return (a.gruppe || '').localeCompare(b.gruppe || '');
            return (a.kode_nr || '').localeCompare(b.kode_nr || '');
        });
    }, [registrations]);

    const weekTotals = useMemo(() => {
        const totals: { [key: number]: number; all: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, all: 0 };
        processedWeekly.forEach(row => {
            for (let i = 1; i <= 7; i++) totals[i] += row.days[i];
            totals.all += row.total;
        });
        return totals;
    }, [processedWeekly]);

    const exportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        if (showAllUsers) {
            csvContent += "Medarbejder;Gruppe;Kode;Beskrivelse;Total\n";
            processedAllUsers.forEach(row => {
                const line = [
                    row.bruger_name,
                    row.gruppe,
                    row.kode_nr,
                    `"${row.beskrivelse.replace(/"/g, '""')}"`,
                    (row.total / 60).toFixed(2)
                ].join(';');
                csvContent += line + "\n";
            });
        } else if (activeTab === 'period') {
            csvContent += "Dato;Tid;Kode;Beskrivelse;Kommentar\n";
            registrations.forEach(row => {
                const line = [
                    new Date(row.fra_tid).toLocaleDateString(),
                    row.tid || '',
                    row.kode_nr,
                    `"${(row.beskrivelse || '').replace(/"/g, '""')}"`,
                    `"${(row.kommentar || '').replace(/"/g, '""')}"`
                ].join(';');
                csvContent += line + "\n";
            });
        } else {
            csvContent += "Gruppe;Kode;Beskrivelse;Man;Tir;Ons;Tor;Fre;Lør;Søn;Total\n";
            processedWeekly.forEach(row => {
                const line = [
                    row.gruppe,
                    row.kode_nr,
                    `"${row.beskrivelse.replace(/"/g, '""')}"`,
                    ...[1, 2, 3, 4, 5, 6, 7].map(d => (row.days[d] / 60).toFixed(2)),
                    (row.total / 60).toFixed(2)
                ].join(';');
                csvContent += line + "\n";
            });
        }
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", showAllUsers ? `medarbejdertotaler.csv` : `tidsregistrering_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col h-[700px]">
            {/* Toolbar */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                        <button
                            onClick={() => setActiveTab('weekly')}
                            className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${activeTab === 'weekly' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-400 hover:text-gray-800'}`}
                        >
                            {t('time.overview_weekly', 'WEEKLY OVERVIEW')}
                        </button>
                        <button
                            onClick={() => setActiveTab('period')}
                            className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${activeTab === 'period' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-400 hover:text-gray-800'}`}
                        >
                            {t('time.overview_period', 'PERIOD')}
                        </button>
                    </div>

                    {/* Mode selector: My overview vs All Users */}
                    <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                        <button
                            onClick={() => setShowAllUsers(false)}
                            className={`px-3 py-2 text-xs font-black rounded-lg transition-all ${!showAllUsers ? 'bg-gray-800 text-white shadow-md' : 'text-gray-400 hover:text-gray-800'}`}
                        >
                            👤 {t('time.overview_my_hours', 'MINE TIMER')}
                        </button>
                        <button
                            onClick={() => setShowAllUsers(true)}
                            className={`px-3 py-2 text-xs font-black rounded-lg transition-all ${showAllUsers ? 'bg-gray-800 text-white shadow-md' : 'text-gray-400 hover:text-gray-800'}`}
                        >
                            👥 {t('time.overview_all_users', 'ALLE MEDARBEJDERE')}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm items-center">
                            <Calendar size={14} className="text-gray-400 ml-2" />
                            {activeTab === 'weekly' ? (
                                <div className="flex items-center gap-1 px-2">
                                    <button
                                        type="button"
                                        onClick={() => changeWeek(-1)}
                                        className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>

                                    <input
                                        type="number"
                                        className="w-16 bg-transparent border-none p-0 text-xs font-black text-gray-600 focus:ring-0 text-center"
                                        value={tempYear || ''}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (!isNaN(val)) setTempYear(val);
                                            else setTempYear(0);
                                        }}
                                    />
                                    <span className="text-gray-300 font-bold">W</span>
                                    <input
                                        type="number"
                                        className="w-10 bg-transparent border-none p-0 text-xs font-black text-gray-600 focus:ring-0 text-center"
                                        value={tempWeek || ''}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (!isNaN(val)) setTempWeek(val);
                                            else setTempWeek(0);
                                        }}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => changeWeek(1)}
                                        className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>

                                    <div className="ml-2 px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black text-gray-500 uppercase tracking-tight whitespace-nowrap">
                                        {formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-2">
                                    <input
                                        type="date"
                                        className="bg-transparent border-none p-0 text-xs font-black text-gray-600 focus:ring-0 cursor-pointer"
                                        value={tempStartDate}
                                        onChange={(e) => setTempStartDate(e.target.value)}
                                    />
                                    <span className="text-gray-300 font-bold">—</span>
                                    <input
                                        type="date"
                                        className="bg-transparent border-none p-0 text-xs font-black text-gray-600 focus:ring-0 cursor-pointer"
                                        value={tempEndDate}
                                        onChange={(e) => setTempEndDate(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {hasPendingChanges && (
                            <button
                                type="button"
                                onClick={handleApplyFilters}
                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all duration-300 animate-pulse hover:animate-none active:scale-95 whitespace-nowrap"
                            >
                                <RefreshCw size={12} />
                                {t('time.overview_hent', 'FETCH')}
                            </button>
                        )}
                    </div>
                </div>

                <button
                    onClick={exportCSV}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all shrink-0"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={16} />}
                    {t('time.overview_export_csv', 'EXPORT CSV')}
                </button>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-200">
                {showAllUsers ? (
                    <table className="w-full text-left border-collapse tabular-nums">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-4 py-4">{t('time.overview_col_user', 'Employee')}</th>
                                <th className="px-4 py-4">{t('time.overview_col_group', 'Group')}</th>
                                <th className="px-4 py-4">{t('time.overview_col_code', 'Code')}</th>
                                <th className="px-4 py-4">{t('time.overview_col_desc', 'Description')}</th>
                                <th className="px-4 py-4 text-right text-gray-800">{t('time.overview_col_total', 'Total')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 whitespace-nowrap">
                            {processedAllUsers.map(row => (
                                <tr
                                    key={`${row.bruger_name}-${row.gruppe}-${row.kode_nr}`}
                                    className="hover:bg-gray-50 group transition-all text-xs border-b border-transparent hover:border-blue-500 active:bg-blue-50 cursor-pointer"
                                >
                                    <td className="px-4 py-2 font-black text-gray-800">{row.bruger_name}</td>
                                    <td className="px-4 py-2 font-black text-gray-500">{row.gruppe}</td>
                                    <td className="px-4 py-2 font-mono text-gray-400">{row.kode_nr}</td>
                                    <td className="px-4 py-2 font-black text-gray-700 max-w-[200px] truncate" title={row.beskrivelse}>{row.beskrivelse}</td>
                                    <td className="px-4 py-2 text-right font-black text-emerald-600 whitespace-nowrap">
                                        {minToDecimal(row.total)}
                                        <span className="ml-2 text-[10px] text-gray-400 font-bold">({minToHHMM(row.total)})</span>
                                    </td>
                                </tr>
                            ))}
                            {processedAllUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <p className="font-black text-gray-300 text-sm uppercase tracking-widest">{t('time.overview_no_data', 'No data for this week')}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="sticky bottom-0 bg-gray-100 border-t-2 border-gray-200 font-black text-xs text-gray-700">
                            <tr>
                                <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-widest text-[10px]">{t('time.overview_total_all_users', 'Total all employees:')}</td>
                                <td className="px-4 py-3 text-right text-emerald-700 text-sm whitespace-nowrap">
                                    {minToDecimal(processedAllUsers.reduce((sum, r) => sum + r.total, 0))}
                                    <span className="ml-2 text-[11px] text-gray-400 font-bold">({minToHHMM(processedAllUsers.reduce((sum, r) => sum + r.total, 0))})</span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                ) : activeTab === 'period' ? (
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                            <tr>
                                <th className="px-6 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('time.overview_col_date', 'Date')}</th>
                                <th className="px-6 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('time.overview_col_time', 'Time')}</th>
                                <th className="px-6 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('time.overview_col_code', 'Code')}</th>
                                <th className="px-6 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('time.overview_col_desc', 'Description')}</th>
                                <th className="px-6 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t('time.overview_col_action', 'Action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {registrations.map(reg => (
                                <tr
                                    key={reg.id}
                                    className="hover:bg-gray-50 group transition-all text-[11px] leading-none cursor-pointer border-b border-transparent hover:border-blue-500 active:bg-blue-50"
                                    onClick={() => setEditingReg(reg)}
                                >
                                    <td className="px-4 py-0 whitespace-nowrap h-6">
                                        <span className="font-black text-gray-700">{new Date(reg.fra_tid).toLocaleDateString()}</span>
                                        <span className="text-[9px] text-gray-400 font-bold uppercase ml-1.5">{new Date(reg.fra_tid).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </td>
                                    <td className="px-4 py-0">
                                        <span className="font-black text-blue-600 tabular-nums">
                                            {reg.tid || '--:--:--'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-0 font-mono font-bold text-gray-500 uppercase">{reg.kode_nr}</td>
                                    <td className="px-4 py-0 truncate max-w-sm">
                                        <span className="font-black text-gray-800">{reg.alias || reg.beskrivelse}</span>
                                        {reg.kommentar && <span className="text-[9px] text-gray-400 font-bold italic ml-1.5">— {reg.kommentar}</span>}
                                    </td>
                                    <td className="px-4 py-0 text-right">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingReg(reg); }}
                                            className="p-1 text-gray-500 hover:text-blue-600 transition-all align-middle"
                                            title="Ret registrering"
                                        >
                                            <Edit size={12} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {registrations.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <p className="font-black text-gray-300 text-sm uppercase tracking-widest">{t('time.overview_no_registrations', 'No registrations found for this period')}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-left border-collapse tabular-nums">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-4 py-4">{t('time.overview_col_group', 'Group')}</th>
                                <th className="px-4 py-4">{t('time.overview_col_code', 'Code')}</th>
                                <th className="px-4 py-4">{t('time.overview_col_desc', 'Description')}</th>
                                <th className="px-2 py-4 text-right">{t('time.overview_col_mon', 'Mon')}</th>
                                <th className="px-2 py-4 text-right">{t('time.overview_col_tue', 'Tue')}</th>
                                <th className="px-2 py-4 text-right">{t('time.overview_col_wed', 'Wed')}</th>
                                <th className="px-2 py-4 text-right">{t('time.overview_col_thu', 'Thu')}</th>
                                <th className="px-2 py-4 text-right">{t('time.overview_col_fri', 'Fri')}</th>
                                <th className="px-2 py-4 text-right text-red-400">{t('time.overview_col_sat', 'Sat')}</th>
                                <th className="px-2 py-4 text-right text-red-400">{t('time.overview_col_sun', 'Sun')}</th>
                                <th className="px-4 py-4 text-right text-gray-800">{t('time.overview_col_total', 'Total')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 whitespace-nowrap">
                            {processedWeekly.map(row => (
                                <tr
                                    key={`${row.mtime}-${row.gruppe}-${row.kode_nr}`}
                                    className="hover:bg-gray-50 group transition-all text-xs border-b border-transparent hover:border-blue-500 active:bg-blue-50 cursor-pointer"
                                >
                                    <td className="px-4 py-2 font-black text-gray-500">{row.gruppe}</td>
                                    <td className="px-4 py-2 font-mono text-gray-400">{row.kode_nr}</td>
                                    <td className="px-4 py-2 font-black text-gray-700 max-w-[150px] truncate" title={row.beskrivelse}>{row.beskrivelse}</td>
                                    <td className="px-2 py-2 text-right">{minToDecimal(row.days[1])}</td>
                                    <td className="px-2 py-2 text-right">{minToDecimal(row.days[2])}</td>
                                    <td className="px-2 py-2 text-right">{minToDecimal(row.days[3])}</td>
                                    <td className="px-2 py-2 text-right">{minToDecimal(row.days[4])}</td>
                                    <td className="px-2 py-2 text-right">{minToDecimal(row.days[5])}</td>
                                    <td className="px-2 py-2 text-right text-red-400">{minToDecimal(row.days[6])}</td>
                                    <td className="px-2 py-2 text-right text-red-400">{minToDecimal(row.days[7])}</td>
                                    <td className="px-4 py-2 text-right font-black text-emerald-600 whitespace-nowrap">
                                        {minToDecimal(row.total)}
                                        <span className="ml-2 text-[10px] text-gray-400 font-bold">({minToHHMM(row.total)})</span>
                                    </td>
                                </tr>
                            ))}
                            {processedWeekly.length === 0 && (
                                <tr>
                                    <td colSpan={11} className="px-6 py-20 text-center">
                                        <p className="font-black text-gray-300 text-sm uppercase tracking-widest">{t('time.overview_no_data', 'No data for this week')}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="sticky bottom-0 bg-gray-100 border-t-2 border-gray-200 font-black text-xs text-gray-700">
                            <tr>
                                <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-widest text-[10px]">{t('time.overview_weekly_total', 'Weekly Total:')}</td>
                                <td className="px-2 py-3 text-right">{minToDecimal(weekTotals[1])}</td>
                                <td className="px-2 py-3 text-right">{minToDecimal(weekTotals[2])}</td>
                                <td className="px-2 py-3 text-right">{minToDecimal(weekTotals[3])}</td>
                                <td className="px-2 py-3 text-right">{minToDecimal(weekTotals[4])}</td>
                                <td className="px-2 py-3 text-right">{minToDecimal(weekTotals[5])}</td>
                                <td className="px-2 py-3 text-right text-red-400">{minToDecimal(weekTotals[6])}</td>
                                <td className="px-2 py-3 text-right text-red-400">{minToDecimal(weekTotals[7])}</td>
                                <td className="px-4 py-3 text-right text-emerald-700 text-sm whitespace-nowrap">
                                    {minToDecimal(weekTotals.all)}
                                    <span className="ml-2 text-[11px] text-gray-400 font-bold">({minToHHMM(weekTotals.all)})</span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>

            <EditRegistrationModal
                isOpen={!!editingReg}
                onClose={() => setEditingReg(null)}
                registration={editingReg}
                onSave={() => fetchData(startDate, endDate)}
            />
        </div>
    );
};

export default OverviewView;
