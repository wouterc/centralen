import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Trash2, GripVertical, Pencil, Settings, X, Lock, Download, Upload, AlertCircle, Loader2 } from 'lucide-react';
import type { OpgaverKode, BrugerProfilTime, KoderGrupper } from '../../types/tidsregistrering';
import { api } from '../../api';
import Toast, { type ToastType } from '../ui/Toast';
import { useTranslation } from '../../services/translationService';
import { useAppState } from '../../StateContext';

interface SetupViewProps {
    favorites: BrugerProfilTime[];
    onRefresh: () => void;
    isAdmin: boolean;
}

const SetupView: React.FC<SetupViewProps> = ({ favorites, onRefresh, isAdmin }) => {
    const { t } = useTranslation();
    const { state } = useAppState();
    const [allKoder, setAllKoder] = useState<OpgaverKode[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [localFavorites, setLocalFavorites] = useState<BrugerProfilTime[]>(favorites);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Modals
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [isManagerOpen, setIsManagerOpen] = useState(false);

    const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
        message: '',
        type: 'info',
        isVisible: false
    });

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type, isVisible: true });
    };

    const loadAllKoder = useCallback(() => {
        api.get<OpgaverKode[]>('/tidsregistrering/koder/').then(setAllKoder);
    }, []);

    useEffect(() => {
        loadAllKoder();
    }, [loadAllKoder]);

    // Sync local favorites when prop changes (if not dragging)
    useEffect(() => {
        if (draggedIndex === null) {
            setLocalFavorites(favorites);
        }
    }, [favorites, draggedIndex]);

    const filteredKoder = allKoder.filter(k =>
        k.kode_nr.includes(searchTerm) || k.beskrivelse.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddFavorite = async (kode: OpgaverKode) => {
        try {
            await api.post('/tidsregistrering/profiler/', {
                opgave_kode: kode.id,
                alias: kode.beskrivelse,
                sortering: localFavorites.length + 1
            });
            onRefresh();
        } catch (e) { showToast('Kunne ikke tilføje favorit', 'error'); }
    };

    const handleRemoveFavorite = async (id: number) => {
        try {
            await api.delete(`/tidsregistrering/profiler/${id}/`);
            onRefresh();
        } catch (e) { showToast('Kunne ikke fjerne favorit', 'error'); }
    };

    const handleUpdateAlias = async (id: number, newAlias: string) => {
        try {
            await api.patch(`/tidsregistrering/profiler/${id}/`, { alias: newAlias });
            // Update locally for immediate feedback
            setLocalFavorites(prev => prev.map(f => f.id === id ? { ...f, alias: newAlias } : f));
        } catch (e) { console.error('Update alias failed', e); }
    };

    // Drag and Drop
    const onDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const onDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newFavs = [...localFavorites];
        const item = newFavs[draggedIndex];
        newFavs.splice(draggedIndex, 1);
        newFavs.splice(index, 0, item);

        setLocalFavorites(newFavs);
        setDraggedIndex(index);
    };

    const onDragEnd = async () => {
        if (draggedIndex === null) return;
        setDraggedIndex(null);

        // Persist new order to backend
        try {
            // Updated sorting for all items
            const updates = localFavorites.map((fav, idx) =>
                api.patch(`/tidsregistrering/profiler/${fav.id}/`, { sortering: idx + 1 })
            );
            await Promise.all(updates);
            onRefresh();
        } catch (e) { console.error('Failed to save order', e); }
    };

    const handleManageCodesClick = () => {
        if (isAdmin) {
            setIsManagerOpen(true);
        } else {
            setIsInfoOpen(true);
        }
    };

    const workspaceAdmins = state.users.filter(u => u.role === 'ADMIN' || u.username === 'admin');

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex h-[700px]">
            {/* Left: Available Codes */}
            <div className="w-1/3 flex flex-col bg-white">
                <div className="p-6 border-b border-gray-100 bg-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-blue-600 rounded-full" />
                            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-widest">{t('time.setup_all_codes', 'All Task Codes')}</h3>
                        </div>
                        <button
                            onClick={handleManageCodesClick}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
                            title={t('time.manage_task_codes', 'Manage task codes')}
                        >
                            <Settings size={16} />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder={t('time.setup_search_placeholder', 'Search codes...')}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-semibold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200">
                    {filteredKoder.map(kode => (
                        <div key={kode.id} className="px-4 py-1.5 hover:bg-gray-100 rounded-md group flex items-center justify-between transition-all cursor-pointer" onClick={() => handleAddFavorite(kode)}>
                            <div className="flex items-center gap-3 truncate pr-2">
                                <span className="font-bold text-gray-800 text-[11px] min-w-[45px]">{kode.kode_nr}</span>
                                <span className="text-[11px] text-gray-400 font-semibold truncate">{kode.beskrivelse}</span>
                            </div>
                            <Plus size={14} className="opacity-0 group-hover:opacity-100 text-blue-600 transition-all shrink-0" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Separator / Gutter */}
            <div className="w-3 bg-gray-300" />

            {/* Right: My Favorites */}
            <div className="flex-1 flex flex-col bg-gray-300">
                <div className="p-6 border-b border-gray-100 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                        <div>
                            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-widest">{t('time.setup_my_favorites', 'My Favorites (Dashboard)')}</h3>
                            <p className="text-[10px] text-gray-400 font-semibold">{t('time.setup_drag_info', 'Drag codes to change the sorting order on your dashboard.')}</p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
                    {localFavorites.map((fav, idx) => (
                        <div
                            key={fav.id}
                            draggable
                            onDragStart={(e) => onDragStart(e, idx)}
                            onDragOver={(e) => onDragOver(e, idx)}
                            onDragEnd={onDragEnd}
                            className={`bg-white py-2 px-4 rounded-xl border border-gray-200 shadow-md flex items-center gap-4 group transition-all duration-200 ${draggedIndex === idx ? 'opacity-50 scale-95 border-blue-200' : 'hover:border-blue-300 hover:shadow-lg'}`}
                        >
                            <div className="text-gray-500 group-hover:text-gray-700 transition-colors cursor-grab active:cursor-grabbing shrink-0">
                                <GripVertical size={18} />
                            </div>
                            <div className="min-w-[60px] font-bold text-gray-400 text-sm tabular-nums">
                                {fav.kode_nr}
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                                <input
                                    id={`alias-input-${fav.id}`}
                                    type="text"
                                    className="flex-1 text-sm font-bold text-gray-700 bg-transparent border border-transparent hover:border-gray-200 focus:border-blue-500 focus:bg-blue-50/50 px-2 py-1 rounded-lg outline-none transition-all placeholder-gray-200 truncate"
                                    value={fav.alias || ''}
                                    onChange={(e) => handleUpdateAlias(fav.id, e.target.value)}
                                    placeholder={t('time.setup_alias_placeholder', 'Give the task a name...')}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const inputEl = document.getElementById(`alias-input-${fav.id}`) as HTMLInputElement;
                                        if (inputEl) {
                                            inputEl.focus();
                                            inputEl.select();
                                        }
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded text-blue-600 hover:text-blue-800 transition-all shrink-0"
                                    title={t('common.edit', 'Rediger')}
                                >
                                    <Pencil size={12} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="h-8 w-px bg-gray-100 mr-2" />
                                <button
                                    onClick={() => handleRemoveFavorite(fav.id)}
                                    className="text-blue-600 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {localFavorites.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 py-20">
                            <Plus size={48} className="mb-4 opacity-50" />
                            <p className="font-bold text-sm uppercase tracking-widest">{t('time.setup_add_hint', 'Add codes from the left side')}</p>
                        </div>
                    )}
                </div>
            </div>

            <TaskCodeInfoModal
                isOpen={isInfoOpen}
                onClose={() => setIsInfoOpen(false)}
                admins={workspaceAdmins}
            />

            <TaskCodeManagerModal
                isOpen={isManagerOpen}
                onClose={() => setIsManagerOpen(false)}
                koder={allKoder}
                onRefresh={loadAllKoder}
                showToast={showToast}
            />

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    );
};

// Info Modal for Regular Users
interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    admins: any[];
}

const TaskCodeInfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, admins }) => {
    const { t } = useTranslation();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm transition-opacity duration-200">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 flex flex-col relative max-h-[90vh]">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors outline-none"
                >
                    <X size={20} />
                </button>
                <div className="flex flex-col items-center text-center mt-2">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                        <Lock size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t('time.manage_task_codes', 'Administrer taakkoder')}</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        {t('time.only_admins_task_codes', 'Kun administratorer har tilladelse til at oprette, redigere eller slette taakkoder.')}
                    </p>
                </div>
                
                <div className="border-t border-gray-100 pt-4 flex-1 overflow-y-auto min-h-0">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('time.contact_admin', 'Kontakt en administrator')}</h4>
                    {admins.length === 0 ? (
                        <p className="text-sm text-gray-500 italic text-center">{t('time.no_admins_found', 'Ingen administratorer fundet.')}</p>
                    ) : (
                        <ul className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                            {admins.map((admin, idx) => (
                                <li key={idx} className="flex flex-col p-3 bg-gray-50 rounded-xl border border-gray-100 text-left">
                                    <span className="font-semibold text-gray-800 text-sm">{admin.display_name || `${admin.first_name} ${admin.last_name}`.trim() || admin.username}</span>
                                    {admin.email && (
                                        <a href={`mailto:${admin.email}`} className="text-xs text-blue-600 hover:underline mt-0.5 break-all">
                                            {admin.email}
                                        </a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                
                <button 
                    onClick={onClose}
                    className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all"
                >
                    {t('common.close', 'Luk')}
                </button>
            </div>
        </div>
    );
};

// Manager Modal for Admins
interface ManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    koder: OpgaverKode[];
    onRefresh: () => void;
    showToast: (msg: string, type?: ToastType) => void;
}

const TaskCodeManagerModal: React.FC<ManagerModalProps> = ({ isOpen, onClose, koder, onRefresh, showToast }) => {
    const { t } = useTranslation();
    const [editingKode, setEditingKode] = useState<OpgaverKode | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [groups, setGroups] = useState<KoderGrupper[]>([]);

    // Form states
    const [kodeNr, setKodeNr] = useState('');
    const [beskrivelse, setBeskrivelse] = useState('');
    const [gruppeId, setGruppeId] = useState<number | ''>('');
    const [submitting, setSubmitting] = useState(false);

    // Delete states
    const [deletingKode, setDeletingKode] = useState<OpgaverKode | null>(null);
    const [importing, setImporting] = useState(false);

    const resetForm = () => {
        setKodeNr('');
        setBeskrivelse('');
        setGruppeId('');
        setEditingKode(null);
        setIsCreating(false);
        setDeletingKode(null);
    };

    useEffect(() => {
        if (isOpen) {
            api.get<KoderGrupper[]>('/tidsregistrering/grupper/').then(setGroups);
        }
    }, [isOpen]);

    useEffect(() => {
        if (editingKode) {
            setKodeNr(editingKode.kode_nr);
            setBeskrivelse(editingKode.beskrivelse);
            setGruppeId(editingKode.gruppe ? Number(editingKode.gruppe) : '');
        }
    }, [editingKode]);

    // Escape listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (deletingKode) {
                    setDeletingKode(null);
                } else if (editingKode || isCreating) {
                    resetForm();
                } else {
                    onClose();
                    resetForm();
                }
            }
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, deletingKode, editingKode, isCreating]);

    if (!isOpen) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!kodeNr.trim()) {
            showToast(t('time.setup_fill_code', 'Udfyld venligst kodens nummer'), "info");
            return;
        }
        if (!beskrivelse.trim()) {
            showToast(t('time.setup_fill_desc', 'Udfyld venligst kodens beskrivelse'), "info");
            return;
        }

        setSubmitting(true);
        try {
            const body = {
                kode_nr: kodeNr,
                beskrivelse: beskrivelse,
                gruppe: gruppeId || null
            };

            if (editingKode) {
                await api.patch(`/tidsregistrering/koder/${editingKode.id}/`, body);
                showToast(t('time.setup_code_updated', 'Taakkode opdateret succesfuldt'), "success");
            } else {
                await api.post('/tidsregistrering/koder/', body);
                showToast(t('time.setup_code_created', 'Taakkode oprettet succesfuldt'), "success");
            }
            onRefresh();
            resetForm();
        } catch (err: any) {
            console.error("Save code error:", err);
            showToast(err.message || t('time.setup_save_error', 'Kunne ikke gemme taakkode'), "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingKode) return;
        setSubmitting(true);
        try {
            await api.delete(`/tidsregistrering/koder/${deletingKode.id}/`);
            showToast(t('time.setup_code_deleted', 'Taakkode slettet succesfuldt'), "success");
            onRefresh();
            resetForm();
        } catch (err: any) {
            console.error("Delete code error:", err);
            showToast(err.message || t('time.setup_delete_error', 'Kunne ikke slette taakkode'), "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            const response = await api.get<Response>('/tidsregistrering/koder/export-csv/', { rawResponse: true });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'opgavekoder.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast("CSV-fil eksporteret succesfuldt", "success");
        } catch (err) {
            showToast("Fejl ved eksport af CSV", "error");
        }
    };

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        setImporting(true);

        try {
            const res = await api.post<{message: string}>('/tidsregistrering/koder/import-csv/', formData);
            showToast(res.message || "Import afsluttet succesfuldt", "success");
            onRefresh();
            resetForm();
        } catch (err: any) {
            showToast(err.message || "Fejl ved import af CSV-fil", "error");
        } finally {
            setImporting(false);
            // Clear input value to allow uploading same file again
            e.target.value = '';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm transition-opacity duration-200">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 flex flex-col relative max-h-[90vh]">
                <button 
                    onClick={() => { onClose(); resetForm(); }}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors outline-none"
                >
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-gray-900 mb-4 text-left">{t('time.manage_task_codes', 'Administrer taakkoder')}</h3>

                {deletingKode ? (
                    <div className="flex-1 flex flex-col min-h-0 text-left">
                        <div className="flex items-center gap-3 p-3 bg-red-50 text-red-800 rounded-xl border border-red-100 mb-4">
                            <AlertCircle size={20} className="shrink-0" />
                            <span className="text-sm font-semibold">{t('time.setup_delete_title', 'Slet taakkode: {{code}}', { code: deletingKode.kode_nr })}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            {t('time.setup_delete_confirm', 'Er du sikker på, at du vil slette deze taakkode? Deze actie kan niet ongedaan worden gemaakt.')}
                        </p>
                        <div className="flex gap-3 mt-auto">
                            <button
                                type="button"
                                onClick={() => setDeletingKode(null)}
                                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-all"
                            >
                                {t('common.cancel', 'Annuller')}
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={submitting}
                                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting && <Loader2 size={16} className="animate-spin" />}
                                {t('time.setup_delete', 'Slet')}
                            </button>
                        </div>
                    </div>
                ) : isCreating || editingKode ? (
                    <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 text-left">
                        <div className="space-y-4 flex-1 overflow-y-auto mb-4 pr-1">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('time.setup_task_code_label', 'Taakkodens nummer')}</label>
                                <input
                                    type="text"
                                    value={kodeNr}
                                    onChange={(e) => setKodeNr(e.target.value)}
                                    placeholder={t('time.setup_task_code_placeholder', 'F.eks. 101, 9304...')}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('time.setup_task_desc_label', 'Beskrivelse')}</label>
                                <input
                                    type="text"
                                    value={beskrivelse}
                                    onChange={(e) => setBeskrivelse(e.target.value)}
                                    placeholder={t('time.setup_task_desc_placeholder', 'F.eks. Administration, Udvikling...')}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('time.setup_task_group_label', 'Gruppe (Valgfri)')}</label>
                                <select
                                    value={gruppeId}
                                    onChange={(e) => setGruppeId(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                >
                                    <option value="">Vælg gruppe...</option>
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id}>{g.gruppe} - {g.beskrivelse}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-auto">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-all"
                            >
                                {t('common.back', 'Tilbage')}
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                            >
                                {submitting && <Loader2 size={16} className="animate-spin" />}
                                {editingKode ? t('time.setup_edit_code', 'Gem ændringer') : t('time.setup_add_code', 'Opret kode')}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="flex-1 flex flex-col min-h-0 text-left">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('time.existing_codes', 'Eksisterende koder')}</span>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                <Plus size={16} /> {t('time.setup_new_code_title', 'Opret ny taakkode')}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[30vh] border border-gray-100 rounded-xl divide-y divide-gray-100 mb-4 pr-1">
                            {koder.length === 0 ? (
                                <p className="p-4 text-sm text-gray-500 italic text-center">{t('time.no_results', 'Ingen koder fundet.')}</p>
                            ) : (
                                koder.map(kode => (
                                    <div key={kode.id} className="flex justify-between items-center p-2.5 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="font-bold text-gray-800 text-xs min-w-[50px]">{kode.kode_nr}</span>
                                            <span className="text-xs text-gray-500 truncate" title={kode.beskrivelse}>{kode.beskrivelse}</span>
                                            {kode.gruppe_navn && (
                                                <span className="text-[9px] bg-gray-100 text-gray-400 rounded px-1.5 py-0.5 font-bold uppercase shrink-0">
                                                    {kode.gruppe_navn}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 ml-4">
                                            <button
                                                onClick={() => setEditingKode(kode)}
                                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                                title={t('common.edit', 'Rediger')}
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => setDeletingKode(kode)}
                                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                                title={t('common.delete', 'Slet')}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Import / Export Section */}
                        <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-4 mb-4">
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all border border-gray-200"
                            >
                                <Download size={14} />
                                {t('time.setup_export_csv', 'Eksporter CSV')}
                            </button>
                            <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all border border-blue-100 cursor-pointer relative">
                                {importing ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Upload size={14} />
                                )}
                                <span>{importing ? t('time.setup_importing', 'Importerer...') : t('time.setup_import_csv', 'Importer CSV')}</span>
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={handleImportCSV}
                                    disabled={importing}
                                />
                            </label>
                        </div>

                        <button
                            onClick={() => { onClose(); resetForm(); }}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all mt-auto"
                        >
                            {t('common.close', 'Luk')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SetupView;
