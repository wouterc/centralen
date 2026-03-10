import React, { useEffect, useState } from 'react';
import type { PinboardPost, PostEvaluationType } from '../types';
import { pinboardService } from '../services/pinboardService';
import { useAppState } from '../StateContext';
import PostIt from '../components/Pinboard/PostIt';
import { Plus, X, Pin, MessageSquare, ThumbsUp, HelpCircle, CheckCircle, Clock, User, Search, Archive } from 'lucide-react';
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

    // New post form state
    const [newPost, setNewPost] = useState({
        titel: '',
        beskrivelse: '',
        team: ''
    });

    useEffect(() => {
        localStorage.setItem('pinboard_filterTeam', filterTeam);
        localStorage.setItem('pinboard_onlyMine', onlyMine.toString());
        localStorage.setItem('pinboard_searchTerm', searchTerm);

        const timer = setTimeout(() => fetchData(), 300);
        return () => clearTimeout(timer);
    }, [filterTeam, onlyMine, searchTerm]);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setSelectedPost(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const postsData = await pinboardService.getAll({
                team: filterTeam,
                only_mine: onlyMine,
                search: searchTerm
            });
            setState(prev => ({ ...prev, pinboardPosts: postsData }));
        } catch (error) {
            console.error('Fejl ved hentning af data:', error);
        } finally {
            setLoading(false);
        }
    };

    const posts = state.pinboardPosts;
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

    const handleSelectPost = async (post: PinboardPost) => {
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

    const handleArchive = async (id: number) => {
        if (!confirm('Er du sikker på, at du vil arkivere dette opslag?')) return;
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
                                <h1 className="text-2xl font-black text-gray-800 tracking-tighter leading-none">
                                    {t('pinboard.title', 'PINBOARD')}
                                </h1>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{t('pinboard.subtitle', 'Ideas & dialogue')}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pl-6 border-l border-gray-400/20">
                            <select
                                value={filterTeam}
                                onChange={(e) => setFilterTeam(e.target.value)}
                                className="bg-white/80 border border-gray-400/10 rounded-xl px-4 py-2 text-[10px] font-black text-gray-700 focus:border-blue-500 focus:outline-none transition-all shadow-sm"
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
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all border
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
                            <div className="relative group/search">
                                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/search:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder={t('common.search_placeholder', 'SEARCH...')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white/80 border border-gray-400/10 rounded-xl pl-9 pr-4 py-2 text-[10px] font-black text-gray-700 focus:border-blue-500 focus:outline-none transition-all shadow-sm w-64 focus:w-96"
                                />
                                {searchTerm && (
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
                        className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-1 active:scale-95 group"
                        title="Opret nyt opslag"
                    >
                        <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 pb-32 custom-scrollbar">

                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-8 pb-32">
                    {posts.length === 0 ? (
                        <div className="w-full text-center py-40">
                            <div className="bg-white/20 p-12 rounded-full inline-block mb-6">
                                <Pin size={64} className="text-gray-400/50 rotate-45" />
                            </div>
                            <p className="text-gray-500 font-black text-xl italic drop-shadow-sm">Tavlen er tom... Hæng noget op!</p>
                        </div>
                    ) : (
                        posts.map((post, idx) => {
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
                        })
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-4xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black italic tracking-tighter">NY POST-IT</h2>
                                <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Hæng din idé op på tavlen</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="hover:rotate-90 transition-transform p-2 bg-white/10 rounded-full">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-8 flex flex-col gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Titel</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3 focus:border-blue-500 focus:outline-none transition-all font-bold text-gray-800"
                                    placeholder="En hurtig overskrift..."
                                    value={newPost.titel}
                                    onChange={e => setNewPost({ ...newPost, titel: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Beskrivelse</label>
                                <textarea
                                    className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3 focus:border-blue-500 focus:outline-none transition-all font-bold text-gray-800 min-h-[120px]"
                                    placeholder="Fortæl lidt mere..."
                                    value={newPost.beskrivelse}
                                    onChange={e => setNewPost({ ...newPost, beskrivelse: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Vælg Team</label>
                                <select
                                    required
                                    className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3 focus:border-blue-500 focus:outline-none transition-all font-bold text-gray-800"
                                    value={newPost.team}
                                    onChange={e => setNewPost({ ...newPost, team: e.target.value })}
                                >
                                    <option value="">Vælg team...</option>
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
                                {creating ? 'HÆNGER OP...' : 'HÆNG OP! 📌'}
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
                        <div className="flex-[1.5] flex flex-col h-full bg-yellow-50/20 overflow-y-auto custom-scrollbar">
                            <div className="p-6 lg:p-8 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                        <Pin size={10} />
                                        <span>Prikbord Opslag</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-[9px] font-black text-gray-400 uppercase bg-gray-100/50 px-2 py-1 rounded-lg">
                                            Ref: #{selectedPost.id}
                                        </div>
                                        {(state.currentUser?.id === selectedPost.oprettet_af || state.currentUser?.role === 'ADMIN') && (
                                            <button
                                                onClick={() => handleArchive(selectedPost.id)}
                                                className="flex items-center gap-1.5 text-[9px] font-black text-red-400 hover:text-red-600 uppercase transition-colors"
                                                title="Arkivér opslag"
                                            >
                                                <Archive size={12} />
                                                <span>Arkivér</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <h2 className="text-3xl font-black text-gray-800 leading-tight mb-4 tracking-tighter decoration-yellow-400 underline underline-offset-4 decoration-2">
                                    {selectedPost.titel}
                                </h2>

                                <div className="text-base text-gray-700 whitespace-pre-wrap italic leading-relaxed font-medium mb-6 bg-white/40 p-5 rounded-2xl border border-white shadow-sm">
                                    {selectedPost.beskrivelse || selectedPost.teaser_text || 'Henter beskrivelse...'}
                                </div>

                                <div className="flex-1 flex flex-col justify-between gap-6">
                                    {selectedPost.evaluation_summary && (
                                        <div className="group">
                                            <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                Status & Statistik
                                                <span className="h-px bg-gray-100 flex-1" />
                                            </h4>
                                            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-white shadow-sm flex flex-wrap items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                                                        <ThumbsUp size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-black text-gray-800 leading-none">{selectedPost.evaluation_summary.GOD_IDE}</p>
                                                        <p className="text-[8px] font-black text-gray-400 uppercase">God idé</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                                        <CheckCircle size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-black text-gray-800 leading-none">{selectedPost.evaluation_summary.LÆST}</p>
                                                        <p className="text-[8px] font-black text-gray-400 uppercase">Læst</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
                                                        <Clock size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-black text-gray-800 leading-none">{selectedPost.evaluation_summary.PENDING}</p>
                                                        <p className="text-[8px] font-black text-gray-400 uppercase">Venter</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {loadingDetail && !selectedPost.evalueringer ? (
                                                    <p className="text-[7px] font-black text-gray-400 uppercase italic">Henter navne...</p>
                                                ) : (
                                                    (selectedPost.evalueringer || []).slice(0, 12).map(ev => (
                                                        <div key={ev.id} className="flex items-center gap-1.5 bg-white/40 px-2 py-1 rounded-lg border border-white shadow-sm">
                                                            <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[7px] font-bold">
                                                                {ev.bruger_details?.username?.[0]?.toUpperCase()}
                                                            </div>
                                                            <p className="text-[8px] font-bold text-gray-600">{ev.bruger_details?.username}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-auto pt-6 border-t border-gray-100">
                                        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Din Vurdering</h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            <button
                                                onClick={() => handleEvaluate(selectedPost.id, 'GOD_IDE')}
                                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border transition-all ${selectedPost.user_evaluation === 'GOD_IDE' ? 'bg-green-600 text-white' : 'bg-white hover:bg-green-50 text-green-700'}`}
                                            >
                                                <ThumbsUp size={18} />
                                                <span className="text-[10px] font-black">GOD IDÉ</span>
                                            </button>
                                            <button
                                                onClick={() => handleEvaluate(selectedPost.id, 'INGEN_MENING')}
                                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border transition-all ${selectedPost.user_evaluation === 'INGEN_MENING' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-blue-50 text-blue-700'}`}
                                            >
                                                <HelpCircle size={18} />
                                                <span className="text-[10px] font-black">VED IKKE</span>
                                            </button>
                                            <button
                                                onClick={() => handleEvaluate(selectedPost.id, 'LÆST')}
                                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border transition-all ${selectedPost.user_evaluation === 'LÆST' ? 'bg-gray-700 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'}`}
                                            >
                                                <CheckCircle size={18} />
                                                <span className="text-[10px] font-black">LÆST</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column (Comments) */}
                        <div className="flex-1 flex flex-col h-full bg-gray-50 border-l border-gray-200">
                            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-white">
                                <h3 className="text-base font-black text-gray-800 flex items-center gap-2 uppercase">
                                    <MessageSquare size={16} className="text-blue-600" />
                                    INFO / Dialog
                                    {loadingDetail && <span className="ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></span>}
                                </h3>
                                <button onClick={() => setSelectedPost(null)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 custom-scrollbar">
                                {(selectedPost.kommentarer || []).length === 0 && !loadingDetail ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                                        <MessageSquare size={20} className="mb-2" />
                                        <p className="text-[10px] font-bold uppercase">Ingen info endnu</p>
                                    </div>
                                ) : (
                                    (selectedPost.kommentarer || []).map((kom, idx) => (
                                        <div key={idx} className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                                <span className="text-gray-800">{kom.bruger_details?.username}</span>
                                                <span>•</span>
                                                <span>{dayjs(kom.oprettet).fromNow()}</span>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl shadow-sm border border-white">
                                                <p className="text-xs text-gray-700">{kom.tekst}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {loadingDetail && (selectedPost.kommentarer || []).length === 0 && (
                                    <div className="flex items-center justify-center py-10 opacity-30">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-white border-t border-gray-200">
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
                                        placeholder="Skriv info..."
                                        className="flex-1 bg-gray-100 border-none rounded-xl py-3 px-4 text-xs font-medium focus:ring-2 focus:ring-blue-500/20"
                                    />
                                    <button type="submit" className="shrink-0 w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-xl shadow-lg">
                                        <Plus size={18} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PinboardPage;
