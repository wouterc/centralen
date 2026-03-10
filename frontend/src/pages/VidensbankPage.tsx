import React, { useState, useEffect, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Search, Plus, LibraryBig, Filter, Trash2, Edit, ExternalLink, Copy, FileText, Loader2, X, Archive, Star, ArchiveRestore, Lock, RotateCcw, AlertCircle, GripVertical } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api';
import HelpButton from '../components/ui/HelpButton';
import type { Viden, VidensKategori } from '../types';
import { useAppState } from '../StateContext';
// Layout is provided by App.tsx
import VidensbankModal from '../components/vidensbank/VidensbankModal';
import VidensbankViewModal from '../components/vidensbank/VidensbankViewModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Toast, { type ToastType } from '../components/ui/Toast';
import DOMPurify from 'dompurify';
import { useTranslation } from '../services/translationService';

interface VidensbankPageProps {
    standalone?: boolean;
}

const DraggableArticleCard: React.FC<{
    viden: Viden;
    onClick: () => void;
    onCopy: (v: Viden) => void;
    onEdit: (v: Viden) => void;
    onDelete: (v: Viden) => void;
    onArchive: (v: Viden) => void;
    onToggleFavorite: (v: Viden) => void;
    onRestore?: (v: Viden) => void;
    onPermanentDelete?: (v: Viden) => void;
}> = ({ viden, onClick, onCopy, onEdit, onDelete, onArchive, onToggleFavorite, onRestore, onPermanentDelete }) => {
    const { t } = useTranslation();
    const isArchived = viden.arkiveret && !viden.slettet;

    return (
        <div
            className={`bg-white rounded-xl shadow-md border border-gray-300 border-l-4 p-3 hover:shadow-xl hover:bg-slate-50 transition-all group relative flex flex-col h-full cursor-pointer ${viden.slettet ? 'border-red-500 opacity-75' : isArchived ? 'opacity-60 grayscale-[0.5] bg-gray-50/50' : ''}`}
            style={{ borderLeftColor: viden.slettet ? '#ef4444' : isArchived ? '#94a3b8' : (viden.kategori_details?.farve || '#2563eb') }}
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 pr-4 pointer-events-none">
                    <div className="flex items-center gap-2 mb-2">
                        <span
                            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded inline-block shadow-sm"
                            style={{
                                backgroundColor: viden.slettet ? '#fef2f2' : isArchived ? '#f1f5f9' : (viden.kategori_details?.farve || '#2563eb') + '15',
                                color: viden.slettet ? '#ef4444' : isArchived ? '#64748b' : viden.kategori_details?.farve || '#2563eb'
                            }}
                        >
                            {viden.slettet ? t('vidensbank.trash', 'Trash') : viden.kategori_details?.navn || t('vidensbank.unknown_category', 'Unknown category')}
                        </span>
                        {isArchived && (
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                                Arkiveret
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <h3 className={`text-lg font-bold leading-tight group-hover:text-blue-700 transition-colors line-clamp-2 ${isArchived ? 'text-gray-500' : 'text-gray-800'}`}>
                            {viden.titel}
                        </h3>
                    </div>
                </div>
                <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    {viden.slettet ? (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); onRestore?.(viden); }}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-1 text-xs font-bold"
                                title="Gendan artikel"
                            >
                                <RotateCcw size={18} />
                                Gendan
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onPermanentDelete?.(viden); }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 text-xs font-bold"
                                title="Slet for evigt"
                            >
                                <Trash2 size={18} />
                                Slet for evigt
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleFavorite(viden); }}
                                className={`p-2 rounded-lg ${viden.favorit ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'}`}
                                title={viden.favorit ? "Fjern fra dine favoritter" : "Marker som din favorit"}
                            >
                                <Star size={18} className={viden.favorit ? "fill-amber-500" : ""} />
                            </button>
                            <button onClick={() => onCopy(viden)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Kopier link">
                                <Copy size={18} />
                            </button>
                            <button onClick={() => onEdit(viden)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Rediger">
                                <Edit size={18} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onArchive(viden); }}
                                className={`p-2 rounded-lg ${isArchived ? 'text-amber-600 bg-amber-50' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'}`}
                                title={isArchived ? "Gendan fra arkiv" : "Arkiver"}
                            >
                                {isArchived ? <ArchiveRestore size={18} className="text-amber-600" /> : <Archive size={18} />}
                            </button>
                            <button onClick={() => onDelete(viden)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Slet">
                                <Trash2 size={18} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div
                className={`text-sm line-clamp-2 mb-2 overflow-hidden pointer-events-none ${isArchived ? 'text-gray-400 italic' : 'text-gray-600'}`}
                dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(viden.indhold, {
                        ALLOWED_TAGS: ['p', 'br', 'span', 'b', 'i', 'u', 'strong', 'em'],
                        ALLOWED_ATTR: []
                    })
                }}
            />

            <div className="flex items-center justify-between border-t border-gray-100 pt-2 mt-auto pointer-events-none">
                <div className="flex items-center gap-3">
                    {viden.link && <ExternalLink size={14} className={isArchived ? 'text-gray-300' : 'text-blue-500'} />}
                    {viden.fil && <FileText size={14} className={isArchived ? 'text-gray-300' : 'text-green-500'} />}
                </div>
                <div className="text-[10px] text-gray-400 font-medium">
                    {new Date(viden.oprettet).toLocaleDateString()}
                    {viden.slettet && <span className="ml-2 text-red-400 font-bold">● Slettet</span>}
                </div>
            </div>
        </div>
    );
};


const SortableCategoryItem: React.FC<{
    kat: VidensKategori;
    isActive: boolean;
    onClick: (id: number) => void;
}> = ({ kat, isActive, onClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: kat.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            className={`group/item px-3 py-2 rounded-md cursor-pointer text-sm transition-colors flex items-center justify-between gap-2 ${isActive ? 'bg-blue-100 text-blue-700 font-semibold shadow-sm' : 'hover:bg-gray-100 text-gray-600'} ${isDragging ? 'opacity-50 ring-2 ring-blue-500 bg-white' : ''}`}
            onClick={() => onClick(kat.id)}
        >
            <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 -ml-2 text-gray-300 hover:text-gray-500 transition-colors shrink-0 outline-none"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical size={14} />
                </div>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: kat.farve }}></span>
                <span className="truncate">{kat.navn}</span>
                {kat.er_privat && <Lock size={12} className="text-gray-400 shrink-0" />}
            </div>
            <span className={`shrink-0 text-[10px] min-w-5 h-5 flex items-center justify-center rounded-full px-1.5 font-bold ${isActive ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-400 opacity-60'} transition-all`}>
                {kat.artikler_count || 0}
            </span>
        </li>
    );
};


const VidensbankPage: React.FC<VidensbankPageProps> = ({ standalone = false }) => {
    const { state, setState } = useAppState();
    const { t } = useTranslation();
    const isAdmin = state.currentUser?.role === 'ADMIN' || state.currentUser?.username === 'admin';

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [vidensbank, setVidensbank] = useState<Viden[]>([]);
    const [kategorier, setKategorier] = useState<VidensKategori[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [valgtKategoriId, setValgtKategoriId] = useState<number | null>(() => {
        const saved = localStorage.getItem('vidensbankCategoryId');
        return saved ? Number(saved) : null;
    });

    useEffect(() => {
        if (valgtKategoriId !== null) {
            localStorage.setItem('vidensbankCategoryId', valgtKategoriId.toString());
        } else {
            localStorage.removeItem('vidensbankCategoryId');
        }
    }, [valgtKategoriId]);
    const [showArchived, setShowArchived] = useState(false);
    const [showTrash, setShowTrash] = useState(false);

    // Pagination state
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const ARTICLES_PER_PAGE = 20;

    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingViden, setEditingViden] = useState<Viden | undefined>(undefined);
    const [viewingViden, setViewingViden] = useState<Viden | undefined>(undefined);
    const [deletingViden, setDeletingViden] = useState<Viden | null>(null);
    const [archivingViden, setArchivingViden] = useState<Viden | null>(null);
    const [permanentDeletingViden, setPermanentDeletingViden] = useState<Viden | null>(null);

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
        message: '',
        type: 'info',
        isVisible: false
    });

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        setToast({ message, type, isVisible: true });
    }, []);

    const loadInitialData = useCallback(async () => {
        try {
            const katRes = await api.get<VidensKategori[]>('/vidensbank/kategorier/');

            // Sort categories if the user has a preferred order
            let sortedKats = katRes;
            const order = state.currentUser?.vidensbank_category_order;
            if (order && order.length > 0) {
                sortedKats = [...katRes].sort((a, b) => {
                    const indexA = order.indexOf(a.id);
                    const indexB = order.indexOf(b.id);

                    // If both are in the order list, use the order
                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    // If only A is in the list, it comes first
                    if (indexA !== -1) return -1;
                    // If only B is in the list, it comes first
                    if (indexB !== -1) return 1;
                    // Otherwise keep original order
                    return 0;
                });
            }

            setKategorier(sortedKats);
        } catch (error) {
            console.error('Fejl ved hentning af initial data', error);
            showToast('Kunne ikke hente kategorier', 'error');
        }
    }, [showToast, state.currentUser?.vidensbank_category_order]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    // Deep linking support for Global Search
    useEffect(() => {
        const fetchAndOpenArticle = async (id: string) => {
            try {
                const article = await api.get<Viden>(`/vidensbank/artikler/${id}/`);
                setViewingViden(article);
                setIsViewModalOpen(true);
            } catch (err) {
                console.error("Failed to fetch article for deep link:", err);
            }
        };

        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) {
            fetchAndOpenArticle(id);
        }
    }, [window.location.search]); // Re-run when URL search params change

    useEffect(() => {
        const saved = localStorage.getItem('vidensbankSearch');
        if (saved) {
            setSearchTerm(saved);
        }
    }, []);

    const fetchArticles = useCallback(async (isLoadMore = false) => {
        if (isLoadMore) setLoadingMore(true);
        else setLoading(true);

        try {
            const params: Record<string, string> = {};
            if (searchTerm) params.search = searchTerm;
            if (valgtKategoriId) params.kategori = valgtKategoriId.toString();

            if (showTrash) {
                params.show_deleted = 'true';
            } else if (showArchived) {
                params.show_archived = 'true';
            }

            params.limit = ARTICLES_PER_PAGE.toString();
            const currentOffset = isLoadMore ? vidensbank.length : 0;
            params.offset = currentOffset.toString();

            const videnRes = await api.get<Viden[]>('/vidensbank/artikler/', { params });

            if (isLoadMore) {
                setVidensbank(prev => [...prev, ...videnRes]);
            } else {
                setVidensbank(videnRes);
                if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
            }
            setHasMore(videnRes.length === ARTICLES_PER_PAGE);
        } catch (error) {
            console.error('Fejl ved hentning af artikler', error);
            showToast('Kunne ikke hente artikler', 'error');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [searchTerm, valgtKategoriId, showArchived, showTrash, vidensbank.length, showToast]);

    useEffect(() => {
        localStorage.setItem('vidensbankSearch', searchTerm);
        // If it's a regular user and they haven't searched/selected anything, keep it empty to encourage searching
        // But for admins, let's show the latest articles by default.
        if (!searchTerm && !valgtKategoriId && !showTrash && !isAdmin) {
            setVidensbank([]);
            setLoading(false);
            setHasMore(false);
            return;
        }

        setLoading(true);
        const timer = setTimeout(() => {
            fetchArticles(false);
        }, searchTerm ? 300 : 0);

        return () => clearTimeout(timer);
    }, [searchTerm, valgtKategoriId, showArchived, showTrash, fetchArticles]);

    const handleScroll = () => {
        if (!scrollContainerRef.current || loading || loadingMore || !hasMore) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        if (scrollHeight - scrollTop - clientHeight < 100) {
            fetchArticles(true);
        }
    };

    const handleCopyLink = async (v: Viden) => {
        try {
            const url = `${window.location.origin}/vidensbank?id=${v.id}`;
            await navigator.clipboard.writeText(url);
            showToast("Link kopieret til udklipsholder", "success");
        } catch (err) {
            showToast("Kunne ikke kopiere link", "error");
        }
    };

    const handleDelete = async () => {
        if (!deletingViden) return;
        const targetId = deletingViden.id;
        try {
            await api.delete(`/vidensbank/artikler/${targetId}/`);
            setVidensbank(prev => prev.filter(v => v.id !== targetId));
            showToast(t('vidensbank.toast_moved_to_trash', 'Article is now moved to trash'), "success");
            loadInitialData(); // Refresh category counts
        } catch (error) {
            console.error("Sletning fejlede", error);
            showToast("Kunne ikke slette artikel", "error");
        }
        setDeletingViden(null);
    };

    const handlePermanentDelete = async () => {
        if (!permanentDeletingViden) return;
        const targetId = permanentDeletingViden.id;
        try {
            await api.delete(`/vidensbank/artikler/${targetId}/permanent_delete/`);
            setVidensbank(prev => prev.filter(v => v.id !== targetId));
            showToast("Artikel slettet permanent", "success");
        } catch (error) {
            showToast("Kunne ikke slette permanent", "error");
        }
        setPermanentDeletingViden(null);
    };

    const handleRestore = async (v: Viden) => {
        try {
            await api.post(`/vidensbank/artikler/${v.id}/restore/`);
            setVidensbank(prev => prev.filter(item => item.id !== v.id));
            showToast(t('vidensbank.toast_restored', 'Article restored from trash'), "success");
            loadInitialData();
        } catch (error) {
            showToast("Kunne ikke gendanne artikel", "error");
        }
    };

    const handleSave = async () => {
        await fetchArticles(false);
        await loadInitialData();
        setIsModalOpen(false);
        setEditingViden(undefined);
    };

    const handleConfirmArchive = async () => {
        if (!archivingViden) return;
        const targetViden = archivingViden;
        try {
            const res = await api.post<{ arkiveret: boolean }>(`/vidensbank/artikler/${targetViden.id}/toggle_archive/`);
            const nowArchived = res.arkiveret;

            showToast(nowArchived ? `"${targetViden.titel}" er nu arkiveret` : `"${targetViden.titel}" er gendannet`, "success");

            setVidensbank(prev => {
                if (!showArchived && nowArchived) {
                    return prev.filter(item => item.id !== targetViden.id);
                } else {
                    return prev.map(item => item.id === targetViden.id ? { ...item, arkiveret: nowArchived } : item);
                }
            });
            loadInitialData(); // Refresh counts
        } catch (error) {
            console.error("Arkivering fejlede", error);
            showToast("Kunne ikke opdatere arkiv-status", "error");
        }
        setArchivingViden(null);
    };

    const handleToggleFavorite = async (v: Viden) => {
        try {
            const res = await api.post<{ favorit: boolean }>(`/vidensbank/artikler/${v.id}/toggle_favorite/`);
            showToast(res.favorit ? "Tilføjet til dine favoritter" : "Fjernet fra dine favoritter", "success");

            setVidensbank(prev => {
                return prev.map(item => item.id === v.id ? { ...item, favorit: res.favorit } : item);
            });
        } catch (error) {
            showToast("Kunne ikke opdatere favorit-status", "error");
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = kategorier.findIndex(k => k.id === active.id);
        const newIndex = kategorier.findIndex(k => k.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newKats = arrayMove(kategorier, oldIndex, newIndex);
            setKategorier(newKats);

            const newOrder = newKats.map(k => k.id);
            try {
                // Save to backend
                await api.patch(`/users/${state.currentUser?.id}/`, {
                    vidensbank_category_order: newOrder
                });

                // Update global state
                if (state.currentUser) {
                    setState(prev => ({
                        ...prev,
                        currentUser: {
                            ...prev.currentUser!,
                            vidensbank_category_order: newOrder
                        }
                    }));
                }
            } catch (error) {
                console.error("Kunne ikke gemme kategori-rækkefølge", error);
                showToast("Kunne ikke gemme din foretrukne rækkefølge", "error");
                // Revert locally if failed? For now keep it optimistic.
            }
        }
    };

    if (standalone) {
        return (
            <div className="h-full bg-gray-50 flex flex-col overflow-hidden relative">
                {!viewingViden && (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <Loader2 className="animate-spin mb-2" size={32} />
                        <p>Henter vejledning...</p>
                    </div>
                )}
                {viewingViden && (
                    <div className="flex-1 overflow-y-auto bg-white article-preview-container">
                        <div className="p-8 max-w-4xl mx-auto">
                            <h1 className="text-3xl font-black text-gray-900 border-b-4 pb-4 mb-6" style={{ borderColor: viewingViden.kategori_details?.farve || '#2563eb' }}>
                                {viewingViden.titel}
                            </h1>

                            <div className="bg-blue-50/50 rounded-2xl border border-blue-100 shadow-sm mb-10 overflow-hidden vidensbank-view-read-only">
                                <ReactQuill
                                    value={viewingViden.indhold}
                                    readOnly={true}
                                    theme="bubble"
                                    modules={{ toolbar: false }}
                                    className="text-gray-900"
                                />
                            </div>

                            {(viewingViden.link || viewingViden.fil) && (
                                <div className="mt-8 pt-8 border-t border-gray-100 flex flex-wrap gap-4">
                                    {viewingViden.link && (
                                        <a
                                            href={viewingViden.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-all font-bold text-sm border-2 border-blue-100 shadow-sm"
                                        >
                                            <ExternalLink size={20} />
                                            Åbn Eksternt Link
                                        </a>
                                    )}
                                    {viewingViden.fil && (
                                        <a
                                            href={viewingViden.fil}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-6 py-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-all font-bold text-sm border-2 border-green-100 shadow-sm"
                                        >
                                            <FileText size={20} />
                                            Se Vedhæftet Dokument
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <Toast
                    message={toast.message}
                    type={toast.type}
                    isVisible={toast.isVisible}
                    onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
                />
            </div>
        );
    }

    return (
        <div className="h-full flex-1 flex bg-gray-300 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="max-w-7xl mx-auto min-h-full flex flex-col relative">
                    <header className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                                <LibraryBig className="text-blue-600" size={32} />
                                {t('kb.title', 'Knowledge Base')}
                                <HelpButton helpPointCode="VIDENSBANK_HELP" className="ml-2" />
                            </h1>
                            <p className="text-gray-500 mt-1">{t('kb.subtitle', 'Collection of knowledge, templates, and guides for case processing.')}</p>
                        </div>
                        <button
                            onClick={() => { setEditingViden(undefined); setIsModalOpen(true); }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-md transition-all font-semibold"
                        >
                            <Plus size={20} />
                            {t('kb.add_new', 'Add new knowledge')}
                        </button>
                    </header>

                    <div className="flex gap-6 flex-1 min-h-0">
                        <aside className="w-64 flex flex-col gap-6 shrink-0 min-h-0">
                            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-300 overflow-y-auto custom-scrollbar flex-1 flex flex-col">
                                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Filter size={14} />
                                    {t('kb.filters', 'Filters')}
                                    {(valgtKategoriId || showArchived || showTrash) && (
                                        <button
                                            onClick={() => { setValgtKategoriId(null); setShowArchived(false); setShowTrash(false); }}
                                            className="ml-auto text-blue-600 hover:text-blue-800 normal-case text-xs font-medium"
                                        >
                                            {t('kb.clear_filters', 'Clear')}
                                        </button>
                                    )}
                                </h2>

                                <div className="space-y-3 mb-4 pb-4 border-b border-gray-100">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={showArchived}
                                                onChange={() => { setShowArchived(!showArchived); if (!showArchived) setShowTrash(false); }}
                                            />
                                            <div className={`block w-9 h-5 rounded-full transition-colors ${showArchived ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
                                            <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${showArchived ? 'translate-x-4' : ''}`}></div>
                                        </div>
                                        <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{t('kb.show_archived', 'Show archived')}</span>
                                    </label>

                                    {isAdmin && (
                                        <button
                                            onClick={() => { setShowTrash(!showTrash); if (!showTrash) setShowArchived(false); }}
                                            className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg transition-all border-2 ${showTrash ? 'bg-red-50 border-red-200 text-red-700 font-bold' : 'bg-white border-transparent text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            <Trash2 size={16} className={showTrash ? 'text-red-600' : 'text-gray-400'} />
                                            <span className="text-xs">{t('vidensbank.trash_deleted', 'Trash (Deleted)')}</span>
                                        </button>
                                    )}
                                </div>

                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">{t('kb.categories', 'Categories')}</h3>
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <ul className="space-y-1">
                                        <li
                                            className={`px-3 py-2 rounded-md cursor-pointer text-sm transition-colors ${!valgtKategoriId ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100 text-gray-600'}`}
                                            onClick={() => setValgtKategoriId(null)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 shrink-0" /> {/* Spacer to align with draggable items */}
                                                {t('kb.all_categories', 'All categories')}
                                            </div>
                                        </li>
                                        <SortableContext
                                            items={kategorier.map(k => k.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {kategorier
                                                .filter(kat => !kat.er_privat || (kat.artikler_count && kat.artikler_count > 0))
                                                .map(kat => (
                                                    <SortableCategoryItem
                                                        key={kat.id}
                                                        kat={kat}
                                                        isActive={valgtKategoriId === kat.id}
                                                        onClick={setValgtKategoriId}
                                                    />
                                                ))}
                                        </SortableContext>
                                    </ul>
                                </DndContext>
                            </div>
                        </aside>

                        <main className="flex-1 flex flex-col gap-6 min-h-0">
                            <div className="bg-white p-2 rounded-xl shadow-md border border-gray-300 relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder={showTrash ? t('kb.search_deleted_placeholder', "Search in deleted articles...") : t('kb.search_placeholder', "Search title or text...")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-gray-700 outline-none"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Tøm søgefelt"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>

                            {showTrash && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                    <AlertCircle className="text-red-600 shrink-0" size={20} />
                                    <div className="text-sm">
                                        <span className="font-black uppercase tracking-wider text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded mr-2">Admin Modus</span>
                                        Her kan du se artikler der er blevet markeret som slettede. Du kan enten gendanne dem til Vidensbanken eller slette dem permanent.
                                    </div>
                                </div>
                            )}

                            <div
                                ref={scrollContainerRef}
                                onScroll={handleScroll}
                                className="flex-1 overflow-y-auto pr-2 custom-scrollbar"
                            >
                                {loading ? (
                                    <div className="flex justify-center items-center h-64">
                                        <Loader2 className="animate-spin text-blue-600" size={48} />
                                    </div>
                                ) : vidensbank.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                        {showTrash ? <Trash2 className="mx-auto text-gray-100 mb-4" size={64} /> : <LibraryBig className="mx-auto text-gray-100 mb-4" size={64} />}
                                        {(!searchTerm && !valgtKategoriId && !showTrash) ? (
                                            <p className="text-gray-400 font-medium">Indtast et emne i søgefeltet eller vælg en kategori for at komme i gang.</p>
                                        ) : showTrash && vidensbank.length === 0 ? (
                                            <p className="text-gray-400 font-medium">{t('kb.trash_empty', 'The trash is empty.')}</p>
                                        ) : (
                                            <>
                                                <p className="text-gray-400 font-medium">{t('kb.no_results', 'We found no results matching your search. Try different keywords.')}</p>
                                                <button
                                                    onClick={() => { setSearchTerm(''); setValgtKategoriId(null); setShowTrash(false); }}
                                                    className="text-blue-600 hover:underline mt-2 text-sm"
                                                >
                                                    {t('kb.clear_all_filters', 'Clear all filters')}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {vidensbank.map(v => (
                                            <DraggableArticleCard
                                                key={v.id}
                                                viden={v}
                                                onClick={() => { setViewingViden(v); setIsViewModalOpen(true); }}
                                                onCopy={handleCopyLink}
                                                onEdit={(v) => { setEditingViden(v); setIsModalOpen(true); }}
                                                onDelete={(v) => setDeletingViden(v)}
                                                onArchive={(v) => setArchivingViden(v)}
                                                onToggleFavorite={handleToggleFavorite}
                                                onRestore={handleRestore}
                                                onPermanentDelete={(v) => setPermanentDeletingViden(v)}
                                            />
                                        ))}
                                    </div>
                                )}
                                {loadingMore && (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="animate-spin text-blue-600" size={24} />
                                    </div>
                                )}
                            </div>
                        </main>
                    </div>

                    <VidensbankViewModal
                        isOpen={isViewModalOpen}
                        onClose={() => setIsViewModalOpen(false)}
                        viden={viewingViden}
                    />

                    <VidensbankModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSave}
                        editingViden={editingViden}
                        kategorier={kategorier}
                        showToast={showToast}
                    />

                    <ConfirmModal
                        isOpen={!!deletingViden}
                        onClose={() => setDeletingViden(null)}
                        onConfirm={handleDelete}
                        title={t('vidensbank.modal_delete_title', "Move to trash")}
                        message={t('vidensbank.modal_delete_confirm', "Are you sure you want to delete \"{{title}}\"? It will be moved to the trash and can be restored by an administrator.", { title: deletingViden?.titel })}
                        confirmText={t('vidensbank.modal_delete_button', "Delete (move to trash)")}
                        isDestructive={true}
                    />

                    <ConfirmModal
                        isOpen={!!permanentDeletingViden}
                        onClose={() => setPermanentDeletingViden(null)}
                        onConfirm={handlePermanentDelete}
                        title="Slet permanent"
                        message={`ADVARSEL: Er du sikker på at du vil slette "${permanentDeletingViden?.titel}" FOR EVIGT? Denne handling kan ikke fortrydes.`}
                        confirmText="SLET PERMANENT"
                        isDestructive={true}
                    />

                    <ConfirmModal
                        isOpen={!!archivingViden}
                        onClose={() => setArchivingViden(null)}
                        onConfirm={handleConfirmArchive}
                        title={archivingViden?.arkiveret ? "Gendan fra arkiv" : "Arkiver viden"}
                        message={`Er du sikker på at du vil ${archivingViden?.arkiveret ? 'gendanne' : 'arkivere'} "${archivingViden?.titel}"?`}
                        confirmText={archivingViden?.arkiveret ? "Gendan" : "Arkiver"}
                        isDestructive={!archivingViden?.arkiveret}
                    />

                    <Toast
                        message={toast.message}
                        type={toast.type}
                        isVisible={toast.isVisible}
                        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
                    />
                </div>
            </div>
        </div>
    );
};

export default VidensbankPage;
