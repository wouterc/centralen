import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Hash, Type } from 'lucide-react';
import type { Tidreg } from '../../types/tidsregistrering';
import { api } from '../../api';

interface EditRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    registration: Tidreg | null;
    onSave: () => void;
}

const EditRegistrationModal: React.FC<EditRegistrationModalProps> = ({ isOpen, onClose, registration, onSave }) => {
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [duration, setDuration] = useState('');
    const [kodeNr, setKodeNr] = useState('');
    const [alias, setAlias] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const formatTimeForInput = (date: Date) => {
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    useEffect(() => {
        if (registration) {
            const fraTid = new Date(registration.fra_tid);
            setDate(fraTid.toISOString().split('T')[0]);
            setStartTime(formatTimeForInput(fraTid));

            if (registration.til_tid) {
                const tilTid = new Date(registration.til_tid);
                setEndTime(formatTimeForInput(tilTid));
            } else {
                setEndTime('');
            }

            setDuration(registration.tid || '');
            setKodeNr(registration.kode_nr);
            setAlias(registration.alias || registration.beskrivelse);
        }
    }, [registration, isOpen]);

    const calculateDuration = (start: string, end: string) => {
        if (!start || !end) return '';
        const [h1, m1] = start.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff < 0) diff += 24 * 60; // Cross midnight
        const h = Math.floor(diff / 60).toString().padStart(2, '0');
        const m = (diff % 60).toString().padStart(2, '0');
        return `${h}:${m}:00`;
    };

    const handleTimeChange = (type: 'start' | 'end', value: string) => {
        if (type === 'start') {
            setStartTime(value);
            if (endTime) setDuration(calculateDuration(value, endTime));
        } else {
            setEndTime(value);
            if (startTime) setDuration(calculateDuration(startTime, value));
        }
    };

    const handleDurationChange = (value: string) => {
        setDuration(value);
        if (!startTime || !value) return;

        // Try to sync end time if duration format is HH:mm:ss or HH:mm
        const parts = value.split(':').map(Number);
        if (parts.length >= 2 && !parts.some(isNaN)) {
            const [sh, sm] = startTime.split(':').map(Number);
            const durationMins = parts[0] * 60 + parts[1];

            let totalMins = (sh * 60 + sm) + durationMins;
            const eh = Math.floor((totalMins / 60) % 24).toString().padStart(2, '0');
            const em = (totalMins % 60).toString().padStart(2, '0');
            setEndTime(`${eh}:${em}`);
        }
    };

    const handleSave = async () => {
        if (!registration || !date || !startTime) return;
        setIsSaving(true);

        try {
            const [y, mStr, dStr] = date.split('-').map(Number);
            const [sh, sm] = startTime.split(':').map(Number);

            // Create start date in local time
            const fra_date = new Date(y, mStr - 1, dStr, sh, sm);
            const fra_tid = fra_date.toISOString();

            let til_tid = null;
            if (endTime) {
                const [eh, em] = endTime.split(':').map(Number);
                const til_date = new Date(y, mStr - 1, dStr, eh, em);

                // If end time is before start time, assume it's next day
                if (til_date <= fra_date) {
                    til_date.setDate(til_date.getDate() + 1);
                }

                // Keep the exact seconds from duration if present
                const durParts = duration.split(':').map(Number);
                if (durParts.length === 3) {
                    til_date.setSeconds(durParts[2]);
                }

                til_tid = til_date.toISOString();
            }

            await api.patch(`/tidsregistrering/registreringer/${registration.id}/`, {
                fra_tid,
                til_tid,
                tid: duration,
                kode_nr: kodeNr,
                alias: alias
            });

            onSave();
            onClose();
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Ret Registrering</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Rediger tid eller opgave</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {/* Date */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            <Calendar size={12} />
                            Dato
                        </label>
                        <input
                            type="date"
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-black text-slate-700 text-sm"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>

                    {/* Times */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                <Clock size={12} />
                                Start
                            </label>
                            <input
                                type="time"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-black text-slate-700 text-sm"
                                value={startTime}
                                onChange={e => handleTimeChange('start', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                <Clock size={12} />
                                Slut
                            </label>
                            <input
                                type="time"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-black text-slate-700 text-sm"
                                value={endTime}
                                onChange={e => handleTimeChange('end', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Duration & Code */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-blue-500">
                                <Clock size={12} />
                                Varighed
                            </label>
                            <input
                                className="w-full bg-blue-50/50 border-2 border-blue-100 rounded-2xl px-5 py-3.5 focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-black text-blue-600 text-sm tabular-nums"
                                value={duration}
                                onChange={e => handleDurationChange(e.target.value)}
                                placeholder="00:00"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                <Hash size={12} />
                                Kode
                            </label>
                            <input
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-black text-slate-700 text-sm uppercase"
                                value={kodeNr}
                                onChange={e => setKodeNr(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Alias */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            <Type size={12} />
                            Alias / Beskrivelse
                        </label>
                        <textarea
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-black text-slate-700 text-sm resize-none h-28 leading-relaxed"
                            value={alias}
                            onChange={e => setAlias(e.target.value)}
                            placeholder="Hvad har du lavet?"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-transparent hover:border-slate-200"
                    >
                        Annuller
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-8 py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                        Gem Ændringer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditRegistrationModal;
