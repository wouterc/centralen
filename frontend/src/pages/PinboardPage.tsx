import React, { useEffect, useState } from 'react';
import type { PinboardPost, PostEvaluationType } from '../types';
import { pinboardService } from '../services/pinboardService';
import { useAppState } from '../StateContext';
import PostIt from '../components/Pinboard/PostIt';
import { Plus, X, Pin, MessageSquare, ThumbsUp, HelpCircle, CheckCircle, Clock, User, Search, Archive, LayoutGrid, Sparkles, Edit2, Save } from 'lucide-react';
import ConfirmModal from '../components/ui/ConfirmModal';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTranslation } from '../services/translationService';

dayjs.extend(relativeTime);

const PinboardPage: React.FC = () => {
    const { state, setState } = useAppState();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(state.pinboardPosts.length === 0);
    const [creating, setCreating] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState<PinboardPost | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [filterTeam, setFilterTeam] = useState<string>(() => localStorage.getItem('pinboard_filterTeam') || '0');
    const [onlyMine, setOnlyMine] = useState<boolean>(() => localStorage.getItem('pinboard_onlyMine') === 'true');
    const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('pinboard_searchTerm') || '');
    const [showArchived, setShowArchived] = useState<boolean>(() => localStorage.getItem('pinboard_showArchived') === 'true');
    const [layoutMode, setLayoutMode] = useState<'dynamic' | 'grid'>(() => {
        return (localStorage.getItem('pinboard_layoutMode') as 'dynamic' | 'grid') || 'dynamic';
    });
    const [archivingPostId, setArchivingPostId] = useState<number | null>(null);

    const [newPost, setNewPost] = useState({
        titel: '',
        beskrivelse: '',
        team: ''
    });

    // Edit post state
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editTeam, setEditTeam] = useState('');
    const [updatingPost, setUpdatingPost] = useState(false);

    useEffect(() => {
        localStorage.setItem('pinboard_filterTeam', filterTeam);
        localStorage.setItem('pinboard_onlyMine', onlyMine.toString());
        localStorage.setItem('pinboard_showArchived', showArchived.toString());

        let active = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                const postsData = await pinboardService.getAll({
                    team: filterTeam,
                    only_mine: onlyMine,
                    show_archived: showArchived
                });
                if (active) {
                    setState(prev => ({ ...prev, pinboardPosts: postsData }));
                }
            } catch (error) {
                if (active) {
                    console.error('Fejl ved hentning af data:', error);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        const timer = setTimeout(() => fetchData(), 300);
        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [filterTeam, onlyMine, showArchived]);

    useEffect(() => {
        localStorage.setItem('pinboard_searchTerm', searchTerm);
    }, [searchTerm]);

    useEffect(() => {
        localStorage.setItem('pinboard_layoutMode', layoutMode);
    }, [layoutMode]);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setSelectedPost(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const posts = state.pinboardPosts.filter(post => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const creatorUsername = post.oprettet_af_details?.username?.toLowerCase() || '';
        const creatorFirstName = post.oprettet_af_details?.first_name?.toLowerCase() || '';
        const creatorLastName = post.oprettet_af_details?.last_name?.toLowerCase() || '';
        const teamName = post.team_details?.navn?.toLowerCase() || '';
        
        return (
            (post.titel && post.titel.toLowerCase().includes(term)) ||
            (post.beskrivelse && post.beskrivelse.toLowerCase().includes(term)) ||
            creatorUsername.includes(term) ||
            creatorFirstName.includes(term) ||
            creatorLastName.includes(term) ||
            `${creatorFirstName} ${creatorLastName}`.includes(term) ||
            teamName.includes(term)
        );
    });
    const scale = posts.length <= 6 ? 1 : Math.max(0.4, 1 - (posts.length - 6) * 0.02);

    const handleEvaluate = async (id: number, evaluering: PostEvaluationType) => {
        try {
            const updatedPost = await pinboardService.evaluate(id, evaluering);
            setState(prev => ({
                ...prev,
                pinboardPosts: prev.pinboardPosts.map(p => p.id === id ? updatedPost : p)
            }));
            if (selectedPost?.id === id) setSelectedPost(updatedPost);
        } catch (err: any) {
            console.error('Failed to evaluate:', err);
            alert('Kunne ikke gemme vurdering: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleAddComment = async (tekst: string) => {
        if (!selectedPost || !tekst.trim()) return;
        try {
            const updatedPost = await pinboardService.addComment(selectedPost.id, tekst);
            setState(prev => ({
                ...prev,
                pinboardPosts: prev.pinboardPosts.map(p => p.id === selectedPost.id ? updatedPost : p)
            }));
            setSelectedPost(updatedPost);
        } catch (err: any) {
            console.error('Failed to add comment:', err);
            alert('Kunne ikke tilføje kommentar: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleSaveChanges = async () => {
        if (!selectedPost || !editTitle.trim() || !editTeam) return;
        setUpdatingPost(true);
        try {
            const updated = await pinboardService.update(selectedPost.id, {
                titel: editTitle,
                beskrivelse: editDesc,
                team: parseInt(editTeam)
            });
            setState(prev => ({
                ...prev,
                pinboardPosts: prev.pinboardPosts.map(p => p.id === selectedPost.id ? updated : p)
            }));
            setSelectedPost(updated);
            setIsEditing(false);
        } catch (err: any) {
            console.error('Failed to update post:', err);
            alert('Kunne ikke opdatere opslag: ' + (err.response?.data?.error || err.message));
        } finally {
            setUpdatingPost(false);
        }
    };

    const handleSelectPost = async (post: PinboardPost) => {
        setIsEditing(false);
        setSelectedPost(post);
        setLoadingDetail(true);
        try {
            const detailedPost = await pinboardService.get(post.id);
            setSelectedPost(detailedPost);
        } catch (err) {
            console.error('Failed to fetch post details:', err);
        } finally {
            setLoadingDetail(false);
        }
    };

    const confirmArchive = async () => {
        if (archivingPostId === null) return;
        const id = archivingPostId;
        try {
            await pinboardService.archive(id);
            setState(prev => ({
                ...prev,
                pinboardPosts: prev.pinboardPosts.filter(p => p.id !== id)
            }));
            setSelectedPost(null);
        } catch (err: any) {
            console.error('Failed to archive:', err);
            alert('Kunne ikke arkivere: ' + (err.response?.data?.error || err.message));
        } finally {
            setArchivingPostId(null);
        }
    };

    const handleUnarchive = async (id: number) => {
        try {
            const updatedPost = await pinboardService.unarchive(id);
            setState(prev => ({
                ...prev,
                pinboardPosts: showArchived
                    ? prev.pinboardPosts.filter(p => p.id !== id)
                    : prev.pinboardPosts.map(p => p.id === id ? updatedPost : p)
            }));
            setSelectedPost(null);
        } catch (err: any) {
            console.error('Failed to unarchive:', err);
            alert('Kunne ikke gendanne: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.titel || !newPost.team) return;

        setCreating(true);
        try {
            const createdPost = await pinboardService.create({
                titel: newPost.titel,
                beskrivelse: newPost.beskrivelse,
                team: parseInt(newPost.team)
            });
            setState(prev => ({
                ...prev,
                pinboardPosts: [createdPost, ...prev.pinboardPosts]
            }));
            setShowCreateModal(false);
            setNewPost({ titel: '', beskrivelse: '', team: '' });
        } catch (error: any) {
            console.error('Fejl ved oprettelse:', error);
            alert('Der opstod en fejl: ' + (error.message || 'Ukendt fejl'));
        } finally {
            setCreating(false);
        }
    };

    if (loading && posts.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="h-full bg-gray-300 flex flex-col relative overflow-hidden">
            {/* Header - Sticky at top */}
            <div className="z-50 px-8 pt-8 pb-4">
                <div className="flex flex-wrap justify-between items-center gap-4 bg-white/70 p-4 rounded-3xl backdrop-blur-xl border border-white/50 shadow-2xl shadow-black/5">
                    <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20">
                                <Pin className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-800 tracking-tighter leading-none flex items-center gap-2">
                                    <span>{t('pinboard.title', 'PINBOARD')}</span>
                                    {loading && (
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent shrink-0" />
                                    )}
                                </h1>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{t('pinboard.subtitle', 'Ideas & dialogue')}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pl-6 border-l border-gray-400/20">
                            <select
                                value={filterTeam}
                                onChange={(e) => setFilterTeam(e.target.value)}
                                disabled={loading}
                                className="bg-white/80 border border-gray-400/10 rounded-xl px-4 py-2 text-[10px] font-black text-gray-700 focus:border-blue-500 focus:outline-none transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="0">{t('common.all_teams', 'ALL TEAMS').toUpperCase()}</option>
                                {state.teams.map(t => (
                                    <option key={t.id} value={t.id}>{t.navn.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 pl-6 border-l border-gray-400/20">
                            <button
                                onClick={() => setOnlyMine(!onlyMine)}
                                disabled={loading}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all border
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    ${onlyMine
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                        : 'bg-white/80 text-gray-500 border-gray-400/10 hover:border-gray-400/20'}
                                `}
                            >
                                <User size={12} className={onlyMine ? 'fill-white' : ''} />
                                {t('common.only_mine', 'ONLY MINE').toUpperCase()}
                            </button>
                        </div>

                        <div className="flex items-center gap-2 pl-6 border-l border-gray-400/20">
                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                disabled={loading}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all border
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    ${showArchived
                                        ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                                        : 'bg-white/80 text-gray-500 border-gray-400/10 hover:border-gray-400/20'}
                                `}
                            >
                                <Archive size={12} className={showArchived ? 'fill-white' : ''} />
                                {showArchived 
                                    ? t('pinboard.filter.show_active', 'Vis aktive').toUpperCase() 
                                    : t('pinboard.filter.show_archived', 'Vis arkiverede').toUpperCase()}
                            </button>
                        </div>

                        <div className="flex items-center gap-2 pl-6 border-l border-gray-400/20">
                            <button
                                onClick={() => setLayoutMode(layoutMode === 'dynamic' ? 'grid' : 'dynamic')}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-white/80 text-gray-500 border border-gray-400/10 hover:border-gray-400/20 rounded-xl text-[10px] font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {layoutMode === 'dynamic' ? (
                                    <>
                                        <LayoutGrid size={12} />
                                        {t('pinboard.layout.traditional', 'Traditionel').toUpperCase()}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={12} />
                                        {t('pinboard.layout.dynamic', 'Dynamisk').toUpperCase()}
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="flex items-center gap-2 pl-6 border-l border-gray-400/20">
                            <div className="relative group/search">
                                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/search:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder={t('common.search_placeholder', 'SEARCH...')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    disabled={loading}
                                    className="bg-white/80 border border-gray-400/10 rounded-xl pl-9 pr-4 py-2 text-[10px] font-black text-gray-700 focus:border-blue-500 focus:outline-none transition-all shadow-sm w-64 focus:w-96 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                {searchTerm && !loading && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={10} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        disabled={loading}
                        className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-1 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        title={t('pinboard.create_new', 'Create new post')}
                    >
                        <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className={`flex-1 overflow-y-auto px-8 pb-32 custom-scrollbar transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>

                {posts.length === 0 ? (
                    <div className="w-full text-center py-40">
                        <div className="bg-white/20 p-12 rounded-full inline-block mb-6">
                            <Pin size={64} className="text-gray-400/50 rotate-45" />
                        </div>
                        <p className="text-gray-500 font-black text-xl italic drop-shadow-sm">{t('pinboard.empty_state', 'The board is empty... Pin something up!')}</p>
                    </div>
                ) : layoutMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-32 pt-6">
                        {posts.map((post) => (
                            <div key={post.id} className="relative transition-all duration-300">
                                <PostIt
                                    post={post}
                                    onClick={handleSelectPost}
                                    scale={1}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-8 pb-32 pt-6">
                        {posts.map((post, idx) => {
                            const jitterX = (Math.sin(idx * 1.5) * 40).toFixed(0);
                            const jitterY = (Math.cos(idx * 2.1) * 30).toFixed(0);

                            return (
                                <div
                                    key={post.id}
                                    className="relative transition-all duration-300 hover:z-50!"
                                    style={{
                                        transform: `translate(${jitterX}px, ${jitterY}px)`,
                                        zIndex: 10 + (idx % 10)
                                    }}
                                >
                                    <PostIt
                                        post={post}
                                        onClick={handleSelectPost}
                                        scale={scale}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-4xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black italic tracking-tighter">{t('pinboard.modal.new_postit', 'NEW POST-IT')}</h2>
                                <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">{t('pinboard.modal.sub_text', 'Pin your idea on the board')}</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="hover:rotate-90 transition-transform p-2 bg-white/10 rounded-full">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-8 flex flex-col gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('pinboard.modal.title_label', 'Title')}</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3 focus:border-blue-500 focus:outline-none transition-all font-bold text-gray-800"
                                    placeholder={t('pinboard.modal.title_placeholder', 'A quick headline...')}
                                    value={newPost.titel}
                                    onChange={e => setNewPost({ ...newPost, titel: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('pinboard.modal.desc_label', 'Description')}</label>
                                <textarea
                                    className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3 focus:border-blue-500 focus:outline-none transition-all font-bold text-gray-800 min-h-[120px]"
                                    placeholder={t('pinboard.modal.desc_placeholder', 'Tell us a bit more...')}
                                    value={newPost.beskrivelse}
                                    onChange={e => setNewPost({ ...newPost, beskrivelse: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('pinboard.modal.select_team_label', 'Select Team')}</label>
                                <select
                                    required
                                    className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3 focus:border-blue-500 focus:outline-none transition-all font-bold text-gray-800"
                                    value={newPost.team}
                                    onChange={e => setNewPost({ ...newPost, team: e.target.value })}
                                >
                                    <option value="">{t('pinboard.modal.select_team_placeholder', 'Select team...')}</option>
                                    {state.teams.map(t => (
                                        <option key={t.id} value={t.id}>{t.navn}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={creating}
                                className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl transition-all"
                            >
                                {creating ? t('pinboard.modal.pinning', 'Pinning...') : t('pinboard.modal.pin', 'PIN IT! 📌')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedPost && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-110 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedPost(null)}>
                    <div
                        className="bg-white rounded-4xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden animate-in zoom-in-95 border border-white/20 relative flex flex-col sm:flex-row"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Left Column */}
                        <div className="flex-[1.5] flex flex-col h-full bg-yellow-50/30 overflow-y-auto custom-scrollbar">
                            <div className="p-6 lg:p-8 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                        <Pin size={10} />
                                        <span>{t('pinboard.detail.post_label', 'Pinboard Post')}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-[9px] font-black text-gray-500 uppercase bg-gray-200/60 px-2 py-1 rounded-lg">
                                            Ref: #{selectedPost.id}
                                        </div>
                                        {(state.currentUser?.id === selectedPost.oprettet_af || state.currentUser?.role === 'ADMIN') && (
                                            <div className="flex items-center gap-3">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            onClick={handleSaveChanges}
                                                            disabled={updatingPost}
                                                            className="flex items-center gap-1.5 text-[9px] font-black text-green-600 hover:text-green-800 uppercase transition-colors"
                                                            title={t('common.save', 'Gem')}
                                                        >
                                                            <Save size={12} />
                                                            <span>{t('common.save', 'Gem')}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => setIsEditing(false)}
                                                            className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 hover:text-gray-700 uppercase transition-colors"
                                                            title={t('common.cancel', 'Annuller')}
                                                        >
                                                            <X size={12} />
                                                            <span>{t('common.cancel', 'Annuller')}</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setEditTitle(selectedPost.titel);
                                                                setEditDesc(selectedPost.beskrivelse || '');
                                                                setEditTeam(selectedPost.team?.toString() || '');
                                                                setIsEditing(true);
                                                            }}
                                                            className="flex items-center gap-1.5 text-[9px] font-black text-blue-500 hover:text-blue-700 uppercase transition-colors"
                                                            title={t('common.edit', 'Rediger')}
                                                        >
                                                            <Edit2 size={12} />
                                                            <span>{t('common.edit', 'Rediger')}</span>
                                                        </button>
                                                        {selectedPost.arkiveret ? (
                                                            <button
                                                                onClick={() => handleUnarchive(selectedPost.id)}
                                                                className="flex items-center gap-1.5 text-[9px] font-black text-green-500 hover:text-green-700 uppercase transition-colors"
                                                                title={t('pinboard.detail.unarchive_tooltip', 'Restore post')}
                                                            >
                                                                <Archive size={12} className="rotate-180" />
                                                                <span>{t('pinboard.detail.unarchive_btn', 'Gendan')}</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => setArchivingPostId(selectedPost.id)}
                                                                className="flex items-center gap-1.5 text-[9px] font-black text-red-400 hover:text-red-600 uppercase transition-colors"
                                                                title={t('pinboard.detail.archive_tooltip', 'Archive post')}
                                                            >
                                                                <Archive size={12} />
                                                                <span>{t('pinboard.detail.archive_btn', 'Archive')}</span>
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="flex flex-col gap-4 mb-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-450 uppercase tracking-widest mb-1.5 ml-1">{t('pinboard.modal.title_label', 'Title')}</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full text-2xl font-black text-gray-800 leading-tight tracking-tighter border-2 border-gray-200 rounded-2xl px-4 py-2 focus:border-blue-500 focus:outline-none transition-all"
                                                value={editTitle}
                                                onChange={e => setEditTitle(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-450 uppercase tracking-widest mb-1.5 ml-1">{t('pinboard.modal.desc_label', 'Description')}</label>
                                            <textarea
                                                className="w-full text-base text-gray-800 whitespace-pre-wrap italic leading-relaxed font-medium bg-white p-4 rounded-2xl border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:outline-none transition-all min-h-[120px]"
                                                value={editDesc}
                                                onChange={e => setEditDesc(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-450 uppercase tracking-widest mb-1.5 ml-1">{t('pinboard.modal.select_team_label', 'Select Team')}</label>
                                            <select
                                                required
                                                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:border-blue-500 focus:outline-none transition-all font-bold text-gray-800 bg-white"
                                                value={editTeam}
                                                onChange={e => setEditTeam(e.target.value)}
                                            >
                                                <option value="">{t('pinboard.modal.select_team_placeholder', 'Select team...')}</option>
                                                {state.teams.map(t => (
                                                    <option key={t.id} value={t.id}>{t.navn}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-4xl font-black text-gray-800 leading-tight mb-2 tracking-tighter decoration-yellow-400 underline underline-offset-4 decoration-2">
                                            {selectedPost.titel}
                                        </h2>
                                                                             <div className="mb-4 flex flex-wrap gap-2 items-center">
                                            {selectedPost.team_details && (
                                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-blue-100">
                                                    Team: {selectedPost.team_details.navn}
                                                </span>
                                            )}
                                            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-650 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-gray-200">
                                                {t('pinboard.detail.by', 'Af')}: {selectedPost.oprettet_af_details?.first_name || selectedPost.oprettet_af_details?.username}
                                            </span>
                                        </div>

                                        <div className="text-lg text-gray-800 whitespace-pre-wrap italic leading-relaxed font-medium mb-6 bg-white p-6 rounded-3xl border border-gray-200/60 shadow-sm">
                                            {selectedPost.beskrivelse || selectedPost.teaser_text || t('pinboard.detail.fetching_desc', 'Fetching description...')}
                                        </div>
                                    </>
                                )}

                                <div className="flex-1 flex flex-col justify-end gap-6 mt-auto">
                                    {selectedPost.evaluation_summary && (
                                        <div className="group">
                                            <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                {t('pinboard.detail.status_and_stats', 'Status & Statistics')}
                                                <span className="h-px bg-gray-200/60 flex-1" />
                                            </h4>
                                            <div className="bg-white p-4 rounded-2xl border border-gray-200/60 shadow-sm flex flex-wrap items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                                                        <ThumbsUp size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-black text-gray-800 leading-none">{selectedPost.evaluation_summary.GOD_IDE}</p>
                                                        <p className="text-[8px] font-black text-gray-400 uppercase">{t('pinboard.detail.good_idea', 'Good idea')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                                        <CheckCircle size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-black text-gray-800 leading-none">{selectedPost.evaluation_summary.LÆST}</p>
                                                        <p className="text-[8px] font-black text-gray-400 uppercase">{t('pinboard.detail.read', 'Read')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
                                                        <Clock size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-black text-gray-800 leading-none">{selectedPost.evaluation_summary.PENDING}</p>
                                                        <p className="text-[8px] font-black text-gray-400 uppercase">{t('pinboard.detail.pending', 'Pending')}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {loadingDetail && !selectedPost.evalueringer ? (
                                                    <p className="text-[7px] font-black text-gray-400 uppercase italic">{t('pinboard.detail.fetching_names', 'Fetching names...')}</p>
                                                ) : (
                                                    (selectedPost.evalueringer || []).slice(0, 12).map(ev => (
                                                        <div key={ev.id} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-gray-200/60 shadow-sm" title={`${ev.bruger_details?.first_name || ''} ${ev.bruger_details?.last_name || ''}`}>
                                                            <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[7px] font-bold text-gray-700">
                                                                {(ev.bruger_details?.first_name || ev.bruger_details?.username)?.[0]?.toUpperCase()}
                                                            </div>
                                                            <p className="text-[8px] font-bold text-gray-650">{ev.bruger_details?.first_name || ev.bruger_details?.username}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-6 border-t border-gray-250/30">
                                        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">{t('pinboard.detail.your_evaluation', 'Your Evaluation')}</h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            <button
                                                onClick={() => handleEvaluate(selectedPost.id, 'GOD_IDE')}
                                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border transition-all ${selectedPost.user_evaluation === 'GOD_IDE' ? 'bg-green-600 text-white border-green-600' : 'bg-white hover:bg-green-50 text-green-700 border-gray-200'}`}
                                            >
                                                <ThumbsUp size={18} />
                                                <span className="text-[10px] font-black">{t('pinboard.detail.good_idea', 'GOOD IDEA')}</span>
                                            </button>
                                            <button
                                                onClick={() => handleEvaluate(selectedPost.id, 'INGEN_MENING')}
                                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border transition-all ${selectedPost.user_evaluation === 'INGEN_MENING' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-blue-50 text-blue-700 border-gray-200'}`}
                                            >
                                                <HelpCircle size={18} />
                                                <span className="text-[10px] font-black">{t('pinboard.detail.eval.dont_know', "DON'T KNOW")}</span>
                                            </button>
                                            <button
                                                onClick={() => handleEvaluate(selectedPost.id, 'LÆST')}
                                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border transition-all ${selectedPost.user_evaluation === 'LÆST' ? 'bg-gray-700 text-white border-gray-700' : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'}`}
                                            >
                                                <CheckCircle size={18} />
                                                <span className="text-[10px] font-black">{t('pinboard.detail.read', 'READ')}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column (Comments) */}
                        <div className="flex-1 flex flex-col h-full bg-gray-800 text-white border-l border-gray-700">
                            <div className="p-5 border-b border-gray-750 flex justify-between items-center bg-gray-900">
                                <h3 className="text-base font-black text-white flex items-center gap-2 uppercase">
                                    <MessageSquare size={16} className="text-blue-400" />
                                    {t('pinboard.detail.info_dialog', 'INFO / Dialog')}
                                    {loadingDetail && <span className="ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></span>}
                                </h3>
                                <button onClick={() => setSelectedPost(null)} className="p-1.5 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 custom-scrollbar">
                                {(selectedPost.kommentarer || []).length === 0 && !loadingDetail ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-450 opacity-60">
                                        <MessageSquare size={20} className="mb-2" />
                                        <p className="text-[10px] font-bold uppercase">{t('pinboard.detail.no_comments', 'Ingen info endnu')}</p>
                                    </div>
                                ) : (
                                    (selectedPost.kommentarer || []).map((kom, idx) => (
                                        <div key={idx} className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                                <span className="text-gray-200">{kom.bruger_details?.username}</span>
                                                <span>•</span>
                                                <span>{dayjs(kom.oprettet).fromNow()}</span>
                                            </div>
                                            <div className="bg-gray-700/60 p-3 rounded-xl shadow-sm border border-gray-650/40">
                                                <p className="text-xs text-gray-100">{kom.tekst}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {loadingDetail && (selectedPost.kommentarer || []).length === 0 && (
                                    <div className="flex items-center justify-center py-10 opacity-30">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-gray-900 border-t border-gray-750">
                                <form
                                    className="relative flex items-center gap-2"
                                    onSubmit={e => {
                                        e.preventDefault();
                                        const form = e.target as HTMLFormElement;
                                        const input = form.elements.namedItem('comment') as HTMLInputElement;
                                        if (input.value.trim()) {
                                            handleAddComment(input.value);
                                            input.value = '';
                                        }
                                    }}
                                >
                                    <input
                                        name="comment"
                                        placeholder={t('pinboard.detail.write_comment_placeholder', 'Skriv info...')}
                                        style={{ backgroundColor: '#374151', color: '#ffffff' }}
                                        className="flex-1 border-none rounded-xl py-3 px-4 text-xs font-medium placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                                    />
                                    <button type="submit" className="shrink-0 w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-colors">
                                        <Plus size={18} />
                                    </button>
                                </form>
                            </div>
                        </div>

                        <ConfirmModal
                            isOpen={archivingPostId !== null}
                            onClose={() => setArchivingPostId(null)}
                            onConfirm={confirmArchive}
                            title={t('pinboard.archive_confirm_title', 'Arkiver opslag')}
                            message={t('pinboard.archive_confirm_message', 'Er du sikker på, at du vil arkivere dette opslag? Det vil blive skjult på den aktive opslagstavle.')}
                            confirmText={t('pinboard.archive_confirm_btn', 'Arkiver')}
                            isDestructive={true}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PinboardPage;
