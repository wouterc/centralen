import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Calendar, Copy, ChevronRight, AlertCircle, Trash2 } from 'lucide-react';
import type { Aktivitet, Gruppe } from '../../services/aarshjulService';
import type { LastAction } from '../../pages/AarshjulPage';
import { aarshjulService } from '../../services/aarshjulService';
import { Layers } from 'lucide-react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isBetween);
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

interface TimelineProps {
    aktiviteter: Aktivitet[];
    setAktiviteter: React.Dispatch<React.SetStateAction<Aktivitet[]>>;
    grupper: Gruppe[];
    onAktivitetClick: (aktivitet: Aktivitet) => void;
    onRefresh: (silent?: boolean) => void;
    viewStartDate: dayjs.Dayjs;
    onAction: (action: LastAction | null) => void;
}

interface InteractionState {
    type: 'move' | 'resize-start' | 'resize-end';
    aktivitet: Aktivitet;
    initialMouseX: number;
    currentMouseX: number;
}

interface ContextMenuState {
    x: number;
    y: number;
    aktivitet: Aktivitet;
}

const Timeline: React.FC<TimelineProps> = ({ aktiviteter, setAktiviteter, grupper, onAktivitetClick, onRefresh, viewStartDate, onAction }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [interaction, setInteraction] = useState<InteractionState | null>(null);
    const [hoveredGroupId, setHoveredGroupId] = useState<number | null | undefined>(undefined);
    const [hoveredAktivitet, setHoveredAktivitet] = useState<Aktivitet | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    const viewEndDate = useMemo(() => viewStartDate.add(1, 'year').subtract(1, 'day').endOf('day'), [viewStartDate]);

    // Generate dynamic months for the header
    const displayMonths = useMemo(() => {
        const months = [];
        for (let i = 0; i < 12; i++) {
            const date = viewStartDate.add(i, 'month');
            const name = date.format('MMMM');
            months.push({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                year: date.format('YYYY')
            });
        }
        return months;
    }, [viewStartDate]);

    // Generate group-based rows
    const groupedRows = useMemo(() => {
        const filtered = aktiviteter.filter(akt => {
            const start = dayjs(akt.start_dato);
            const end = dayjs(akt.slut_dato);
            return (
                (start.isBefore(viewEndDate) || start.isSame(viewEndDate)) &&
                (end.isAfter(viewStartDate) || end.isSame(viewStartDate))
            );
        });

        const groupsMap: Record<string, Aktivitet[]> = {};
        filtered.forEach(akt => {
            const gid = akt.gruppe?.toString() || 'unassigned';
            if (!groupsMap[gid]) groupsMap[gid] = [];
            groupsMap[gid].push(akt);
        });

        // Structure by defined groups + unassigned
        const result: { gruppe: Gruppe | null; rows: Aktivitet[][] }[] = [];

        // Regular groups
        grupper.forEach(g => {
            const groupActivities = groupsMap[g.id.toString()] || [];
            if (groupActivities.length >= 0) { // Keep group header even if empty? User said "based on these groups"
                const sorted = [...groupActivities].sort((a, b) => dayjs(a.start_dato).unix() - dayjs(b.start_dato).unix());
                const grid: Aktivitet[][] = [];

                sorted.forEach(akt => {
                    let placed = false;
                    for (let i = 0; i < grid.length; i++) {
                        const lastInRow = grid[i][grid[i].length - 1];
                        if (dayjs(akt.start_dato).isAfter(dayjs(lastInRow.slut_dato))) {
                            grid[i].push(akt);
                            placed = true;
                            break;
                        }
                    }
                    if (!placed) grid.push([akt]);
                });
                result.push({ gruppe: g, rows: grid });
            }
        });

        // Unassigned group
        const unassigned = groupsMap['unassigned'] || [];
        if (unassigned.length > 0) {
            const sorted = [...unassigned].sort((a, b) => dayjs(a.start_dato).unix() - dayjs(b.start_dato).unix());
            const grid: Aktivitet[][] = [];
            sorted.forEach(akt => {
                let placed = false;
                for (let i = 0; i < grid.length; i++) {
                    const lastInRow = grid[i][grid[i].length - 1];
                    if (dayjs(akt.start_dato).isAfter(dayjs(lastInRow.slut_dato))) {
                        grid[i].push(akt);
                        placed = true;
                        break;
                    }
                }
                if (!placed) grid.push([akt]);
            });
            result.push({ gruppe: null, rows: grid });
        }

        return result;
    }, [aktiviteter, grupper, viewStartDate, viewEndDate]);

    const getPosition = (date: string) => {
        const d = dayjs(date);
        let target = d;
        if (d.isBefore(viewStartDate)) target = viewStartDate;
        const actualViewEnd = viewEndDate.add(1, 'day').startOf('day');
        if (d.isAfter(actualViewEnd)) target = actualViewEnd;

        const diff = target.diff(viewStartDate, 'day');
        const totalDays = actualViewEnd.diff(viewStartDate, 'day');
        return (diff / totalDays) * 100;
    };

    // Close context menu on click elsewhere
    useEffect(() => {
        const closeMenu = () => setContextMenu(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    // Handle interaction
    useEffect(() => {
        if (!interaction) return;

        const handleMouseMove = (e: MouseEvent) => {
            setInteraction(prev => prev ? { ...prev, currentMouseX: e.clientX } : null);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setInteraction(null);
            }
        };

        const handleMouseUp = async () => {
            if (interaction && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const deltaX = interaction.currentMouseX - interaction.initialMouseX;

                if (Math.abs(deltaX) < 5 && (!hoveredGroupId || hoveredGroupId === interaction.aktivitet.gruppe)) {
                    onAktivitetClick(interaction.aktivitet);
                    setInteraction(null);
                    setHoveredGroupId(undefined);
                    return;
                }

                // Check for group change
                const isGroupChange = hoveredGroupId !== undefined && hoveredGroupId !== (interaction.aktivitet.gruppe ?? null);

                if (isGroupChange) {
                    const updateData = {
                        ...interaction.aktivitet,
                        gruppe: hoveredGroupId
                    };

                    // Optimistic update
                    setAktiviteter(prev => prev.map(a => a.id === interaction.aktivitet.id ? { ...a, gruppe: hoveredGroupId ?? null } : a));

                    try {
                        onAction({
                            type: 'update',
                            id: interaction.aktivitet.id,
                            previousData: { ...interaction.aktivitet }
                        });
                        await aarshjulService.update(interaction.aktivitet.id, updateData);
                        onRefresh(true);
                    } catch (error) {
                        onAction(null);
                        onRefresh(); // Real refresh on error to sync back
                        console.error('Kunne ikke skifte gruppe:', error);
                    }
                    setInteraction(null);
                    setHoveredGroupId(undefined);
                    return;
                }

                const deltaPercentage = (deltaX / rect.width) * 100;
                const totalDays = viewEndDate.add(1, 'day').diff(viewStartDate, 'day');
                const deltaDays = Math.round((deltaPercentage / 100) * totalDays);

                if (deltaDays !== 0) {
                    let newStart = interaction.aktivitet.start_dato;
                    let newEnd = interaction.aktivitet.slut_dato;

                    if (interaction.type === 'move') {
                        newStart = dayjs(newStart).add(deltaDays, 'day').format('YYYY-MM-DD');
                        newEnd = dayjs(newEnd).add(deltaDays, 'day').format('YYYY-MM-DD');
                    } else if (interaction.type === 'resize-start') {
                        newStart = dayjs(newStart).add(deltaDays, 'day').format('YYYY-MM-DD');
                    } else if (interaction.type === 'resize-end') {
                        newEnd = dayjs(newEnd).add(deltaDays, 'day').format('YYYY-MM-DD');
                    }

                    const updateData = {
                        navn: interaction.aktivitet.navn,
                        beskrivelse: interaction.aktivitet.beskrivelse,
                        farve: interaction.aktivitet.farve,
                        start_dato: newStart,
                        slut_dato: newEnd
                    };

                    // Optimistic update
                    setAktiviteter(prev => prev.map(a => a.id === interaction.aktivitet.id ? { ...a, ...updateData } : a));

                    try {
                        // Store current state for undo
                        onAction({
                            type: 'update',
                            id: interaction.aktivitet.id,
                            previousData: {
                                navn: interaction.aktivitet.navn,
                                beskrivelse: interaction.aktivitet.beskrivelse,
                                farve: interaction.aktivitet.farve,
                                start_dato: interaction.aktivitet.start_dato,
                                slut_dato: interaction.aktivitet.slut_dato,
                                gruppe: interaction.aktivitet.gruppe
                            }
                        });

                        await aarshjulService.update(interaction.aktivitet.id, updateData);
                        onRefresh(true);
                    } catch (error) {
                        onAction(null);
                        onRefresh(); // Real refresh on error
                        console.error('Kunne ikke opdatere aktivitet:', error);
                    }
                }
            }
            setInteraction(null);
            setHoveredGroupId(undefined);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [interaction, viewStartDate, viewEndDate, onRefresh, onAktivitetClick]);

    const preview = useMemo(() => {
        if (!interaction || !containerRef.current) return null;
        const rect = containerRef.current.getBoundingClientRect();
        const deltaX = interaction.currentMouseX - interaction.initialMouseX;
        const deltaPercentage = (deltaX / rect.width) * 100;

        const totalDays = viewEndDate.add(1, 'day').diff(viewStartDate, 'day');
        const deltaDays = Math.round((deltaPercentage / 100) * totalDays);

        let newStart = interaction.aktivitet.start_dato;
        let newEnd = interaction.aktivitet.slut_dato;

        if (interaction.type === 'move') {
            newStart = dayjs(newStart).add(deltaDays, 'day').format('YYYY-MM-DD');
            newEnd = dayjs(newEnd).add(deltaDays, 'day').format('YYYY-MM-DD');
        } else if (interaction.type === 'resize-start') {
            newStart = dayjs(newStart).add(deltaDays, 'day').format('YYYY-MM-DD');
        } else if (interaction.type === 'resize-end') {
            newEnd = dayjs(newEnd).add(deltaDays, 'day').format('YYYY-MM-DD');
        }

        return { start: newStart, end: newEnd };
    }, [interaction, viewStartDate, viewEndDate]);

    const weeks = useMemo(() => {
        let current = viewStartDate.startOf('isoWeek');
        if (current.isBefore(viewStartDate)) current = viewStartDate;

        const res: { weekNumber: number; left: number; width: number }[] = [];

        while (current.isBefore(viewEndDate)) {
            const weekNum = current.isoWeek();
            const weekStart = current;
            let weekEnd = current.endOf('isoWeek');
            if (weekEnd.isAfter(viewEndDate)) weekEnd = viewEndDate;

            const left = getPosition(weekStart.format('YYYY-MM-DD'));
            const right = getPosition(weekEnd.add(1, 'day').format('YYYY-MM-DD'));

            res.push({
                weekNumber: weekNum,
                left,
                width: right - left
            });

            current = current.add(1, 'week').startOf('isoWeek');
        }
        return res;
    }, [viewStartDate, viewEndDate, getPosition]);

    const todayPos = useMemo(() => {
        const today = dayjs();
        if (today.isBefore(viewStartDate) || today.isAfter(viewEndDate)) return null;
        return getPosition(today.format('YYYY-MM-DD'));
    }, [viewStartDate, viewEndDate, getPosition]);

    const handleDuplicate = async (akt: Aktivitet) => {
        const duplicateData = {
            navn: `${akt.navn} (Kopi)`,
            beskrivelse: akt.beskrivelse,
            farve: akt.farve,
            start_dato: akt.start_dato,
            slut_dato: akt.slut_dato,
            gruppe: akt.gruppe
        };

        try {
            const newAkt = await aarshjulService.create(duplicateData);
            onAction({
                type: 'create',
                id: newAkt.id,
                previousData: {}
            });
            onRefresh();
        } catch (error) {
            console.error('Kunne ikke duplikere aktivitet:', error);
        }
    };

    const handleDuplicateToNextYear = async (akt: Aktivitet) => {
        const newStart = dayjs(akt.start_dato).add(1, 'year').format('YYYY-MM-DD');
        const newEnd = dayjs(akt.slut_dato).add(1, 'year').format('YYYY-MM-DD');

        const duplicateData = {
            navn: akt.navn,
            beskrivelse: akt.beskrivelse,
            farve: akt.farve,
            start_dato: newStart,
            slut_dato: newEnd,
            gruppe: akt.gruppe
        };

        try {
            const newAkt = await aarshjulService.create(duplicateData);
            onAction({
                type: 'create',
                id: newAkt.id,
                previousData: {}
            });
            onRefresh();
        } catch (error) {
            console.error('Kunne ikke duplikere aktivitet:', error);
        }
    };


    const handleDelete = async (id: number) => {
        if (!confirm('Er du sikker på, at du vil slette denne aktivitet?')) return;
        try {
            await aarshjulService.delete(id);
            onRefresh();
        } catch (error) {
            console.error('Kunne ikke slette aktivitet:', error);
        }
    };

    return (
        <div
            ref={containerRef}
            className={`relative w-full bg-slate-100 flex flex-col h-full select-none ${interaction ? (interaction.type === 'move' ? 'cursor-grabbing' : 'cursor-col-resize') : ''}`}
        >
            {/* Header Column Container */}
            <div className="flex flex-col bg-slate-200 border-b border-slate-300/60 z-10">
                {/* Row 1: Months */}
                <div className="flex">
                    {displayMonths.map((month, i) => (
                        <div key={`${month.name}-${i}`} className="flex-1 text-center py-4 border-r border-slate-300 last:border-r-0 bg-white/20">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{month.name}</span>
                            <div className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest">{month.year}</div>
                        </div>
                    ))}
                </div>

                {/* Row 2: Weeks */}
                <div className="relative h-10 flex border-t border-slate-300/60 items-center bg-slate-200/50">
                    {weeks.map((w, i) => (
                        <div
                            key={`${w.weekNumber}-${i}`}
                            className="absolute h-full border-r border-slate-300/40 flex items-center justify-center overflow-hidden"
                            style={{ left: `${w.left}%`, width: `${w.width}%` }}
                        >
                            <span className="text-[10px] font-black text-slate-500 opacity-40 tabular-nums tracking-tighter">
                                {w.weekNumber}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Grid Lines (Vertical) */}
            <div className="absolute inset-0 flex pointer-events-none top-[96px]">
                {displayMonths.map((_, index) => (
                    <div key={index} className="flex-1 border-r last:border-r-0 h-full border-slate-300/20 transition-colors" />
                ))}
            </div>

            {/* Today Marker Line */}
            {todayPos !== null && (
                <div
                    className="absolute top-0 bottom-0 w-px bg-red-500/40 z-40 pointer-events-none"
                    style={{ left: `${todayPos}%` }}
                >
                    <div className="absolute top-[84px] -left-1 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                    <div className="absolute top-[88px] left-3 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm whitespace-nowrap uppercase tracking-tighter">
                        I dag
                    </div>
                </div>
            )}

            {/* Activities Area */}
            <div className="relative flex-1 px-8 py-2 overflow-y-auto custom-scrollbar bg-slate-100">
                <div className="relative min-h-full space-y-4">
                    {groupedRows.map((groupBlock, groupIndex) => (
                        <div
                            key={groupIndex}
                            className={`relative transition-colors rounded-2xl ${interaction?.type === 'move' && (hoveredGroupId === (groupBlock.gruppe?.id ?? null)) ? 'bg-blue-50/50 ring-2 ring-blue-500/20' : ''}`}
                            onMouseEnter={() => interaction?.type === 'move' && setHoveredGroupId(groupBlock.gruppe?.id ?? null)}
                        >
                            {/* Group Rows */}
                            <div className="space-y-1 min-h-[36px]">
                                {groupBlock.rows.map((row, rowIndex) => (
                                    <div key={rowIndex} className="relative w-full h-9 flex items-center">
                                        {/* Inline Group Label (only on first row) */}
                                        {rowIndex === 0 && (
                                            <div className="sticky left-0 z-40 h-full flex items-center pointer-events-none pr-8">
                                                <div className="bg-slate-900 pl-5 pr-4 py-1.5 -ml-8 rounded-r-2xl shadow-[0_8px_16px_-4px_rgba(0,0,0,0.3)] flex items-center gap-2.5 pointer-events-auto transition-all hover:scale-105 group/label border-y border-r border-white/10">
                                                    <div className="p-1 bg-slate-800 rounded-lg text-indigo-400 group-hover/label:text-indigo-300 transition-colors">
                                                        <Layers size={10} strokeWidth={3} />
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white whitespace-nowrap">
                                                        {groupBlock.gruppe?.navn || 'Ugrupperet'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {row.map(akt => {
                                            const isInteracting = interaction?.aktivitet.id === akt.id;
                                            const currentStart = isInteracting && preview ? preview.start : akt.start_dato;
                                            const currentEnd = isInteracting && preview ? preview.end : akt.slut_dato;

                                            const left = getPosition(currentStart);
                                            const right = getPosition(currentEnd);
                                            const width = Math.max(right - left, 0.5);

                                            if (left >= 100 || right <= 0) return null;

                                            return (
                                                <div
                                                    key={akt.id}
                                                    className={`absolute h-9 rounded-[16px] shadow-[0_6px_12px_-4px_rgba(0,0,0,0.15)] transition-all group overflow-visible ${isInteracting ? 'z-50 ring-[5px] ring-blue-500/20 opacity-95 scale-[1.01]' : 'hover:shadow-[0_12px_24px_-6px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:z-30'}`}
                                                    style={{
                                                        left: `${left}%`,
                                                        width: `${width}%`,
                                                        backgroundColor: akt.farve,
                                                        top: 0,
                                                        cursor: interaction ? (interaction.type === 'move' ? 'grabbing' : 'col-resize') : 'pointer'
                                                    }}
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        setContextMenu({ x: e.clientX, y: e.clientY, aktivitet: akt });
                                                    }}
                                                    onMouseMove={(e) => {
                                                        setMousePos({ x: e.clientX, y: e.clientY });
                                                        if (!interaction && !contextMenu) setHoveredAktivitet(akt);
                                                    }}
                                                    onMouseLeave={() => setHoveredAktivitet(null)}
                                                >
                                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[16px]" />

                                                    {/* Resize Handle Start */}
                                                    <div
                                                        className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-white/20 rounded-l-[16px] z-20 flex items-center justify-center group/handle"
                                                        onMouseDown={(e) => {
                                                            e.stopPropagation();
                                                            setInteraction({ type: 'resize-start', aktivitet: akt, initialMouseX: e.clientX, currentMouseX: e.clientX });
                                                        }}
                                                    >
                                                        <div className="w-0.5 h-3 bg-white/30 rounded-full group-hover/handle:bg-white/70 transition-colors" />
                                                    </div>

                                                    {/* Drag Handle */}
                                                    <div
                                                        className="absolute inset-0 px-4 flex items-center overflow-hidden cursor-grab active:cursor-grabbing"
                                                        onMouseDown={(e) => {
                                                            if (e.button !== 0) return;
                                                            setInteraction({ type: 'move', aktivitet: akt, initialMouseX: e.clientX, currentMouseX: e.clientX });
                                                            setHoveredGroupId(akt.gruppe ?? null);
                                                        }}
                                                    >
                                                        <span className="text-[10px] font-[950] truncate text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] uppercase tracking-[0.05em]">
                                                            {akt.navn}
                                                        </span>
                                                    </div>

                                                    {/* Resize Handle End */}
                                                    <div
                                                        className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-white/20 rounded-r-[16px] z-20 flex items-center justify-center group/handle"
                                                        onMouseDown={(e) => {
                                                            e.stopPropagation();
                                                            setInteraction({ type: 'resize-end', aktivitet: akt, initialMouseX: e.clientX, currentMouseX: e.clientX });
                                                        }}
                                                    >
                                                        <div className="w-0.5 h-3 bg-white/30 rounded-full group-hover/handle:bg-white/70 transition-colors" />
                                                    </div>

                                                    {/* Live Date Preview */}
                                                    {isInteracting && (
                                                        <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl text-white px-4 py-2 rounded-[16px] whitespace-nowrap shadow-[0_20px_40px_rgba(0,0,0,0.3)] z-50 flex flex-col items-center border border-white/10">
                                                            <div className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] mb-0.5">Opdaterer Periode</div>
                                                            <div className="text-xs font-black tabular-nums">
                                                                {dayjs(currentStart).format('D. MMM')} — {dayjs(currentEnd).format('D. MMM')}
                                                            </div>
                                                            <div className="absolute -top-1 w-2 h-2 bg-slate-900 rotate-45 border-l border-t border-white/10" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                                {groupBlock.rows.length === 0 && (
                                    <div className="h-9 flex items-center px-6">
                                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">Ingen aktiviteter i denne gruppe</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {groupedRows.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-200 flex-col gap-6">
                            <div className="w-32 h-32 bg-slate-50 rounded-[40px] flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
                                <Calendar size={56} className="opacity-10" strokeWidth={1} />
                            </div>
                            <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40">Perioden er tom</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Hover Tooltip */}
            {hoveredAktivitet && !interaction && !contextMenu && (
                <div
                    className="fixed z-110 pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95"
                    style={{
                        left: mousePos.x + 20,
                        top: mousePos.y + 20,
                    }}
                >
                    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] p-4 max-w-xs ring-1 ring-white/20">
                        <div className="flex items-start gap-4 mb-3">
                            <div className="w-2 h-10 rounded-full shrink-0 mt-1" style={{ backgroundColor: hoveredAktivitet.farve }} />
                            <div>
                                <h4 className="text-white font-black text-sm leading-tight mb-1 drop-shadow-sm">
                                    {hoveredAktivitet.navn}
                                </h4>
                                <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                    <Calendar size={10} strokeWidth={3} />
                                    {dayjs(hoveredAktivitet.start_dato).format('D. MMM')} — {dayjs(hoveredAktivitet.slut_dato).format('D. MMM')}
                                </div>
                            </div>
                        </div>

                        {hoveredAktivitet.beskrivelse && (
                            <div className="pt-3 border-t border-white/5">
                                <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-3 italic">
                                    {hoveredAktivitet.beskrivelse.replace(/<[^>]*>/g, '').substring(0, 150)}
                                    {hoveredAktivitet.beskrivelse.length > 150 ? '...' : ''}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-100 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 p-2 min-w-[240px] animate-in fade-in zoom-in duration-200"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-2 border-b border-slate-50 mb-1">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{contextMenu.aktivitet.navn}</div>
                    </div>

                    <button
                        onClick={() => {
                            handleDuplicate(contextMenu.aktivitet);
                            setContextMenu(null);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-xl transition-all group"
                    >
                        <div className="p-1.5 bg-slate-50 group-hover:bg-indigo-100 rounded-lg text-slate-400 group-hover:text-indigo-600 transition-colors">
                            <Copy size={16} />
                        </div>
                        <span className="text-sm font-bold">Duplikér markeret</span>
                        <ChevronRight size={14} className="ml-auto opacity-30" />
                    </button>

                    <button
                        onClick={() => {
                            handleDuplicateToNextYear(contextMenu.aktivitet);
                            setContextMenu(null);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl transition-all group"
                    >
                        <div className="p-1.5 bg-slate-50 group-hover:bg-blue-100 rounded-lg text-slate-400 group-hover:text-blue-600 transition-colors">
                            <div className="relative">
                                <Copy size={16} />
                                <ChevronRight size={8} className="absolute -right-1 -bottom-1" />
                            </div>
                        </div>
                        <span className="text-sm font-bold">Duplikér til næste år</span>
                        <ChevronRight size={14} className="ml-auto opacity-30" />
                    </button>

                    <button
                        onClick={() => {
                            onAktivitetClick(contextMenu.aktivitet);
                            setContextMenu(null);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-slate-700 rounded-xl transition-all group"
                    >
                        <div className="p-1.5 bg-slate-50 group-hover:bg-slate-100 rounded-lg text-slate-400 group-hover:text-slate-600 transition-colors">
                            <AlertCircle size={16} />
                        </div>
                        <span className="text-sm font-bold">Redigér detaljer</span>
                    </button>

                    <div className="h-px bg-slate-100 my-1 mx-2" />

                    <button
                        onClick={() => {
                            handleDelete(contextMenu.aktivitet.id);
                            setContextMenu(null);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 text-red-500 rounded-xl transition-all group"
                    >
                        <div className="p-1.5 bg-red-50/50 group-hover:bg-red-100 rounded-lg text-red-400 group-hover:text-red-600 transition-colors">
                            <Trash2 size={16} />
                        </div>
                        <span className="text-sm font-bold">Slet aktivitet</span>
                    </button>
                </div>
            )}

            {/* Edge Fading */}
            <div className="absolute left-0 top-[96px] bottom-0 w-12 bg-linear-to-r from-white to-transparent pointer-events-none z-10 opacity-40" />
            <div className="absolute right-0 top-[96px] bottom-0 w-12 bg-linear-to-l from-white to-transparent pointer-events-none z-10 opacity-40" />
        </div>
    );
};

export default Timeline;
