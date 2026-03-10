import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, GripVertical, Pencil } from 'lucide-react';
import type { OpgaverKode, BrugerProfilTime } from '../../types/tidsregistrering';
import { api } from '../../api';
import Toast, { type ToastType } from '../ui/Toast';
import { useTranslation } from '../../services/translationService';

interface SetupViewProps {
    favorites: BrugerProfilTime[];
    onRefresh: () => void;
}

const SetupView: React.FC<SetupViewProps> = ({ favorites, onRefresh }) => {
    const { t } = useTranslation();
    const [allKoder, setAllKoder] = useState<OpgaverKode[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [localFavorites, setLocalFavorites] = useState<BrugerProfilTime[]>(favorites);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
        message: '',
        type: 'info',
        isVisible: false
    });

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type, isVisible: true });
    };

    useEffect(() => {
        api.get<OpgaverKode[]>('/tidsregistrering/koder/').then(setAllKoder);
    }, []);

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

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex h-[700px]">
            {/* Left: Available Codes */}
            <div className="w-1/3 flex flex-col bg-white">
                <div className="p-6 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-4 bg-blue-600 rounded-full" />
                        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-widest">{t('time.setup_all_codes', 'All Task Codes')}</h3>
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
                            <div className="text-gray-300 group-hover:text-blue-400 transition-colors cursor-grab active:cursor-grabbing shrink-0">
                                <GripVertical size={18} />
                            </div>
                            <div className="min-w-[60px] font-bold text-gray-400 text-sm tabular-nums">
                                {fav.kode_nr}
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                                <input
                                    type="text"
                                    className="flex-1 text-sm font-bold text-gray-700 bg-transparent border-none p-0 focus:ring-0 placeholder-gray-200 truncate"
                                    value={fav.alias || ''}
                                    onChange={(e) => handleUpdateAlias(fav.id, e.target.value)}
                                    placeholder={t('time.setup_alias_placeholder', 'Give the task a name...')}
                                />
                                <Pencil size={12} className="text-blue-600 transition-opacity" />
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

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    );
};

export default SetupView;
