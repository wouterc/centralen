import React, { useEffect, useState, useRef } from 'react';
import type { AppLink, AppPurpose } from '../types';
import { appLinkService } from '../services/appLinkService';
import { useAppState } from '../StateContext';
import { Search, Plus, X, ExternalLink, Folder, FileText, Tag, Briefcase, Link, Pencil, Trash2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const AppsPage: React.FC = () => {
    const { state } = useAppState();
    const [apps, setApps] = useState<AppLink[]>([]);
    const [purposes, setPurposes] = useState<AppPurpose[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingApp, setEditingApp] = useState<AppLink | null>(null);
    const [deletingApp, setDeletingApp] = useState<AppLink | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        path: '',
        teams: [] as number[],
        purposes: [] as number[]
    });
    const [submitting, setSubmitting] = useState(false);
    const [newPurposeInput, setNewPurposeInput] = useState('');
    const [showTeamDropdown, setShowTeamDropdown] = useState(false);
    const [showPurposeDropdown, setShowPurposeDropdown] = useState(false);
    const [purposeToCreate, setPurposeToCreate] = useState<string | null>(null);
    const teamDropdownRef = useRef<HTMLDivElement>(null);
    const purposeDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target as Node)) {
                setShowTeamDropdown(false);
            }
            if (purposeDropdownRef.current && !purposeDropdownRef.current.contains(event.target as Node)) {
                setShowPurposeDropdown(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowTeamDropdown(false);
                setShowPurposeDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [appsData, purposesData] = await Promise.all([
                appLinkService.getAll(),
                appLinkService.getPurposes()
            ]);
            setApps(appsData);
            setPurposes(purposesData);
        } catch (error) {
            console.error('Fejl ved hentning af data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchApps = async () => {
        try {
            const data = await appLinkService.getAll();
            setApps(data);
        } catch (error) {
            console.error('Fejl ved hentning af apps:', error);
        }
    };

    const openModal = (app?: AppLink) => {
        if (app) {
            setEditingApp(app);
            setFormData({
                title: app.title,
                description: app.description || '',
                path: app.path,
                teams: app.teams || [],
                purposes: app.purposes || []
            });
        } else {
            setEditingApp(null);
            setFormData({ title: '', description: '', path: '', teams: [], purposes: [] });
        }
        setNewPurposeInput('');
        setShowTeamDropdown(false);
        setShowPurposeDropdown(false);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingApp) {
                await appLinkService.update(editingApp.id, formData);
            } else {
                await appLinkService.create(formData);
            }
            setShowModal(false);
            fetchApps();
        } catch (error: any) {
            alert('Fejl ved gemning: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreatePurpose = async () => {
        if (!newPurposeInput.trim()) return;

        const exists = purposes.find(p => p.name.toLowerCase() === newPurposeInput.trim().toLowerCase());
        if (exists) {
            if (!formData.purposes.includes(exists.id)) {
                setFormData({ ...formData, purposes: [...formData.purposes, exists.id] });
            }
            setNewPurposeInput('');
            setShowPurposeDropdown(false);
            return;
        }

        setPurposeToCreate(newPurposeInput.trim());
    };

    const confirmCreatePurpose = async () => {
        if (!purposeToCreate) return;
        setSubmitting(true);
        try {
            const newP = await appLinkService.createPurpose(purposeToCreate);
            setPurposes([...purposes, newP]);
            setFormData({ ...formData, purposes: [...formData.purposes, newP.id] });
            setNewPurposeInput('');
            setPurposeToCreate(null);
            setShowPurposeDropdown(false);
        } catch (error: any) {
            alert('Fejl ved oprettelse af formål: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (e: React.MouseEvent, app: AppLink) => {
        e.stopPropagation();
        openModal(app);
    };

    const handleDelete = (e: React.MouseEvent, app: AppLink) => {
        e.stopPropagation();
        setDeletingApp(app);
    };

    const confirmDelete = async () => {
        if (!deletingApp) return;
        setSubmitting(true);
        try {
            await appLinkService.delete(deletingApp.id);
            setDeletingApp(null);
            fetchApps();
        } catch (error: any) {
            alert('Fejl ved sletning: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpen = async (app: AppLink) => {
        try {
            await appLinkService.open(app.id);
        } catch (error: any) {
            alert('Fejl ved åbning: ' + error.message);
        }
    };

    const handleOpenFolder = async (e: React.MouseEvent, app: AppLink) => {
        e.stopPropagation(); // Don't trigger the card's open action
        try {
            await appLinkService.openFolder(app.id);
        } catch (error: any) {
            alert('Fejl ved åbning af mappe: ' + error.message);
        }
    };

    const filteredApps = apps.filter(app => {
        const searchLower = searchTerm.toLowerCase();
        return (
            app.title.toLowerCase().includes(searchLower) ||
            (app.description?.toLowerCase() || '').includes(searchLower) ||
            (app.purposes_details?.some(p => p.toLowerCase().includes(searchLower))) ||
            (app.teams_details?.some(t => t.toLowerCase().includes(searchLower)))
        );
    });

    return (
        <div className="h-full bg-gray-300 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-8 pb-4">
                <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-200">
                                <Briefcase size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-800 tracking-tighter leading-none uppercase">Apps & Dokumenter</h1>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Direkte adgang til drevet</p>
                            </div>
                        </div>

                        <div className="ml-6 pl-6 border-l border-gray-100">
                            <div className="relative group/search">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/search:text-indigo-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Søg i apps, teams eller formål..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm font-medium text-gray-700 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all w-80 focus:w-96"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:scale-95"
                    >
                        <Plus size={20} />
                        <span>TILFØJ NY</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 text-gray-400">
                        <p className="font-bold animate-pulse">Henter data...</p>
                    </div>
                ) : filteredApps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 text-gray-400">
                        <Folder size={64} className="mb-4 opacity-20" />
                        <p className="font-bold">Ingen apps fundet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredApps.map(app => (
                            <div
                                key={app.id}
                                onClick={() => handleOpen(app)}
                                className="group bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full"
                            >
                                <div className="flex items-start gap-4 mb-3">
                                    <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        {app.path.trim().startsWith('http') ? <Link size={24} /> : <FileText size={24} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors truncate">{app.title}</h3>
                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                            {app.teams_details?.map(t => (
                                                <span key={t} className="text-[10px] font-bold text-gray-400 uppercase tracking-tight line-clamp-1">[{t}]</span>
                                            )) || <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tight">INGEN GRUPPE</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Row */}
                                <div className="flex items-center gap-2 mb-4 bg-gray-50/50 p-1.5 rounded-xl border border-gray-100">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleOpen(app); }}
                                        className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm active:scale-95"
                                        title="Åbn fil/link"
                                    >
                                        <ExternalLink size={16} />
                                        <span className="text-[10px] font-black uppercase">Åbn</span>
                                    </button>

                                    {!app.path.trim().startsWith('http') && (
                                        <button
                                            onClick={(e) => handleOpenFolder(e, app)}
                                            className="p-1.5 bg-white hover:bg-indigo-50 text-indigo-600 rounded-lg transition-all border border-gray-100 shadow-sm active:scale-95 flex items-center justify-center min-w-[32px]"
                                            title="Åbn mappe"
                                        >
                                            <Folder size={16} />
                                        </button>
                                    )}

                                    <button
                                        onClick={(e) => handleEdit(e, app)}
                                        className="p-1.5 bg-white hover:bg-gray-100 text-gray-600 rounded-lg transition-all border border-gray-100 shadow-sm active:scale-95"
                                        title="Rediger"
                                    >
                                        <Pencil size={16} />
                                    </button>

                                    <button
                                        onClick={(e) => handleDelete(e, app)}
                                        className="p-1.5 bg-white hover:bg-red-50 text-red-500 rounded-lg transition-all border border-gray-100 shadow-sm active:scale-95"
                                        title="Slet"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                                    {app.description ? (app.description.length > 100 ? app.description.substring(0, 100) + '...' : app.description) : 'Ingen beskrivelse tilgængelig.'}
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {app.purposes_details?.map(p => (
                                        <div key={p} className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-lg text-[10px] font-black text-gray-600 uppercase tracking-wider">
                                            <Tag size={10} />
                                            {p}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight">
                                    {editingApp ? 'Rediger App/Dokument' : 'Tilføj ny App/Dokument'}
                                </h2>
                                <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest">
                                    {editingApp ? 'Opdater link til fil eller URL' : 'Opret direkte link til fil på drevet'}
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="hover:rotate-90 transition-transform p-2 bg-white/10 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Titel</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-gray-800"
                                        placeholder="F.eks. Itinerary Template"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Sti (Path) eller Link (URL)</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-gray-800"
                                        placeholder="C:\Sti\Til\Fil.xlsx ELLER https://google.com"
                                        value={formData.path}
                                        onChange={e => setFormData({ ...formData, path: e.target.value })}
                                    />
                                </div>
                                {/* Teams Selection */}
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Team / Gruppe (Vælg én eller flere)</label>

                                    {/* Selected Teams Tags */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {formData.teams.map(tid => {
                                            const team = state.teams.find(t => t.id === tid);
                                            return (
                                                <div key={tid} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-[11px] font-black border border-indigo-100 animate-in fade-in zoom-in-95">
                                                    {team?.navn || tid}
                                                    <button type="button" onClick={() => setFormData({ ...formData, teams: formData.teams.filter(id => id !== tid) })} className="hover:text-red-500 transition-colors">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Dropdown for unselected teams */}
                                    <div className="relative" ref={teamDropdownRef}>
                                        <button
                                            type="button"
                                            onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                                            className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-indigo-300 transition-all text-sm font-bold text-gray-600 ring-offset-2 focus:ring-2 focus:ring-indigo-500/20"
                                        >
                                            <span className={formData.teams.length === 0 ? "text-gray-400" : "text-gray-800"}>
                                                {formData.teams.length === 0 ? "Vælg team(s)..." : `+ Tilføj endnu et team (${state.teams.filter(t => !formData.teams.includes(t.id)).length} tilbage)`}
                                            </span>
                                            {showTeamDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>

                                        {showTeamDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 z-120 max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-200">
                                                {state.teams.filter(t => !formData.teams.includes(t.id)).length === 0 ? (
                                                    <div className="px-4 py-3 text-xs font-bold text-gray-400 text-center uppercase tracking-widest">Alle teams er valgt</div>
                                                ) : (
                                                    state.teams.filter(t => !formData.teams.includes(t.id)).map(team => (
                                                        <button
                                                            key={team.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({ ...formData, teams: [...formData.teams, team.id] });
                                                                // Removed setShowTeamDropdown(false) to keep open for multi-select
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 text-sm font-bold transition-colors flex items-center gap-2"
                                                        >
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }}></div>
                                                            {team.navn}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Purposes Selection */}
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Formål (Vælg eller skriv nyt)</label>

                                    {/* Selected Purposes Tags */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {formData.purposes.map(pid => {
                                            const purpose = purposes.find(p => p.id === pid);
                                            return (
                                                <div key={pid} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[11px] font-black border border-emerald-100 animate-in fade-in zoom-in-95">
                                                    {purpose?.name || pid}
                                                    <button type="button" onClick={() => setFormData({ ...formData, purposes: formData.purposes.filter(id => id !== pid) })} className="hover:text-red-500 transition-colors">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Dropdown + Input for Purposes */}
                                    <div className="relative" ref={purposeDropdownRef}>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Vælg eller skriv nyt formål..."
                                                    value={newPurposeInput}
                                                    onChange={e => {
                                                        setNewPurposeInput(e.target.value);
                                                        if (!showPurposeDropdown) setShowPurposeDropdown(true);
                                                    }}
                                                    onFocus={() => setShowPurposeDropdown(true)}
                                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreatePurpose())}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-gray-800 pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPurposeDropdown(!showPurposeDropdown)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600"
                                                >
                                                    {showPurposeDropdown ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleCreatePurpose}
                                                className="px-6 py-2.5 bg-indigo-50 text-indigo-600 font-black rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                                            >
                                                TILFØJ
                                            </button>
                                        </div>

                                        {showPurposeDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 z-120 max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-200">
                                                {/* Filtered purposes based on input */}
                                                {purposes
                                                    .filter(p => !formData.purposes.includes(p.id))
                                                    .filter(p => p.name.toLowerCase().includes(newPurposeInput.toLowerCase()))
                                                    .map(purpose => (
                                                        <button
                                                            key={purpose.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({ ...formData, purposes: [...formData.purposes, purpose.id] });
                                                                setNewPurposeInput('');
                                                                // Removed setShowPurposeDropdown(false) to keep open for multi-select
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-gray-700 hover:text-emerald-600 text-sm font-bold transition-colors flex items-center justify-between gap-2"
                                                        >
                                                            <span>{purpose.name}</span>
                                                            <Plus size={12} className="opacity-40" />
                                                        </button>
                                                    ))
                                                }
                                                {newPurposeInput.trim() !== '' && !purposes.some(p => p.name.toLowerCase() === newPurposeInput.toLowerCase().trim()) && (
                                                    <div className="px-4 py-1 border-t border-gray-50 mt-1 pt-2">
                                                        <button
                                                            type="button"
                                                            onClick={handleCreatePurpose}
                                                            className="w-full text-left px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all"
                                                        >
                                                            <Plus size={14} />
                                                            Opret "{newPurposeInput}"
                                                        </button>
                                                    </div>
                                                )}
                                                {purposes.filter(p => !formData.purposes.includes(p.id)).length === 0 && newPurposeInput === '' && (
                                                    <div className="px-4 py-3 text-xs font-bold text-gray-400 text-center uppercase tracking-widest">Alle eksisterende formål er valgt</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Beskrivelse</label>
                                    <textarea
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-gray-800 min-h-[80px]"
                                        placeholder="Hvad bruges dette dokument til?"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] mt-2"
                            >
                                {submitting ? 'GEMMER...' : editingApp ? 'OPDATER APP' : 'OPRET APP'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingApp && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-110 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 bg-red-50 text-red-600 flex flex-col items-center gap-4 text-center">
                            <div className="bg-red-100 p-4 rounded-full">
                                <AlertTriangle size={32} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight">Bekræft sletning</h2>
                                <p className="text-sm font-medium text-red-500/80 mt-1">
                                    Er du sikker på, at du vil slette <strong>{deletingApp.title}</strong>? Denne handling kan ikke fortrydes.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 bg-white flex gap-3">
                            <button
                                onClick={() => setDeletingApp(null)}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-all"
                            >
                                ANNULLER
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={submitting}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {submitting ? 'SLETTER...' : 'JA, SLET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Purpose Creation Confirmation Modal */}
            {purposeToCreate && (
                <div className="fixed inset-0 bg-indigo-900/40 backdrop-blur-md z-200 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 pb-4 flex flex-col items-center text-center">
                            <div className="bg-emerald-100 p-5 rounded-3xl text-emerald-600 mb-6 shadow-inner">
                                <Tag size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-tight uppercase">Nyt formål?</h2>
                            <p className="text-gray-500 font-medium mt-3 px-2">
                                Vil du oprette <span className="text-indigo-600 font-black italic">"{purposeToCreate}"</span> som et nyt formål til genbrug i hele systemet?
                            </p>
                        </div>
                        <div className="p-8 pt-6 flex flex-col gap-3">
                            <button
                                onClick={confirmCreatePurpose}
                                disabled={submitting}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Plus size={18} />
                                        <span>JA, OPRET FORMÅL</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setPurposeToCreate(null)}
                                className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-400 font-bold rounded-xl transition-colors"
                            >
                                ANNULLER
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppsPage;
