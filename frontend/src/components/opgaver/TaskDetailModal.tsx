import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { OpgaveStatus, OpgavePriority } from '../../types';
import type { Opgave, User, Team } from '../../types';
import { opgaveService } from '../../services/opgaveService';
import { useAppState } from '../../StateContext';
import { X, Save, MessageSquare, Trash2, Edit, Archive } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

import { STATUS_LABELS, PRIORITY_LABELS } from '../../constants';
import ConfirmModal from '../ui/ConfirmModal';
import Toast, { type ToastType } from '../ui/Toast';

interface TaskDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    opgave?: Opgave; // If undefined, we are creating
    onSaved: () => void;
    users: User[]; // Pass users for assignee picker
}

const CustomToolbar = ({ id }: { id: string }) => (
    <div id={id} className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1 rounded-t-lg">
        <select className="ql-header" defaultValue="">
            <option value="1">Overskrift 1</option>
            <option value="2">Overskrift 2</option>
            <option value="">Normal</option>
        </select>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button className="ql-bold"></button>
        <button className="ql-italic"></button>
        <button className="ql-underline"></button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button className="ql-list" value="ordered"></button>
        <button className="ql-list" value="bullet"></button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button className="ql-link"></button>
        <button className="ql-image"></button>
        <button className="ql-clean"></button>
    </div>
);

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ isOpen, onClose, opgave, onSaved, users }) => {
    const { state } = useAppState();
    const { currentUser } = state;

    // Form States
    const [titel, setTitel] = useState('');
    const [beskrivelse, setBeskrivelse] = useState('');
    const [status, setStatus] = useState<OpgaveStatus>(OpgaveStatus.BACKLOG);
    const [prioritet, setPrioritet] = useState<OpgavePriority>(OpgavePriority.MEDIUM);
    const [ansvarlige, setAnsvarlige] = useState<number[]>([]);
    const [deadline, setDeadline] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

    // Comment States
    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');

    // Editor Focus State
    const [activeEditor, setActiveEditor] = useState<'desc' | 'new-comment' | 'edit-comment'>('desc');

    // Modal & Toast States
    const [confirmDeleteTask, setConfirmDeleteTask] = useState(false);
    const [confirmArchiveTask, setConfirmArchiveTask] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState<number | null>(null);

    const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
        message: '',
        type: 'info',
        isVisible: false
    });

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type, isVisible: true });
    };

    useEffect(() => {
        if (isOpen) {
            if (opgave) {
                setTitel(opgave.titel);
                setBeskrivelse(opgave.beskrivelse);
                setStatus(opgave.status);
                setPrioritet(opgave.prioritet);
                setAnsvarlige(opgave.ansvarlige || []);
                setDeadline(opgave.deadline || '');
                setSelectedTeamId(opgave.team || null);
            } else {
                setTitel('');
                setBeskrivelse('');
                setStatus(OpgaveStatus.BACKLOG);
                setPrioritet(OpgavePriority.MEDIUM);
                setAnsvarlige([]);
                setDeadline('');
                setSelectedTeamId(state.currentTeamId || null);
            }
            setNewComment('');
            setEditingCommentId(null);
            setEditingCommentText('');
            setActiveEditor('desc');
        }
    }, [isOpen, opgave, state.currentTeamId]);

    const handleSave = async () => {
        const data = {
            titel,
            beskrivelse,
            status,
            prioritet,
            ansvarlige,
            deadline: deadline || null,
            team: selectedTeamId,
        };

        try {
            if (opgave) {
                await opgaveService.update(opgave.id, data);
                showToast('Opgave opdateret', 'success');
            } else {
                await opgaveService.create(data);
                showToast('Opgave oprettet', 'success');
            }
            onSaved();
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Fejl ved gemning af opgave', 'error');
        }
    };

    const handleAddComment = async () => {
        if (!opgave || !newComment.trim()) return;
        try {
            await opgaveService.addComment(opgave.id, newComment);
            setNewComment('');
            onSaved();
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateComment = async () => {
        if (!editingCommentId || !editingCommentText.trim()) return;
        try {
            await opgaveService.updateComment(editingCommentId, editingCommentText);
            setEditingCommentId(null);
            setEditingCommentText('');
            onSaved();
            showToast('Kommentar opdateret', 'success');
        } catch (error) {
            console.error(error);
            showToast('Kunne ikke opdatere kommentar', 'error');
        }
    };


    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={opgave ? 'Rediger Opgave' : 'Ny Opgave'} wide>
            <div className="flex flex-col lg:flex-row gap-6 h-[70vh]">
                {/* Left: Main Content */}
                <div className="flex-1 flex flex-col gap-0 overflow-hidden">

                    {/* Sticky Toolbar Stack */}
                    <div className="shrink-0 z-20 pt-1">
                        <div className={activeEditor === 'desc' ? 'block' : 'hidden'}>
                            <CustomToolbar id="toolbar-desc" />
                        </div>
                        <div className={activeEditor === 'new-comment' ? 'block' : 'hidden'}>
                            <CustomToolbar id="toolbar-new-comment" />
                        </div>
                        <div className={activeEditor === 'edit-comment' ? 'block' : 'hidden'}>
                            <CustomToolbar id="toolbar-edit-comment" />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 pl-1 pb-2 custom-scrollbar pt-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Titel</label>
                            <input
                                type="text"
                                value={titel}
                                onChange={(e) => setTitel(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Hvad skal laves?"
                            />
                        </div>

                        <div className="flex-1 flex flex-col min-h-[200px]">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Beskrivelse</label>
                            <div className="flex-1 bg-white border rounded-b-lg overflow-hidden">
                                <ReactQuill
                                    theme="snow"
                                    value={beskrivelse}
                                    onChange={setBeskrivelse}
                                    modules={{ toolbar: { container: '#toolbar-desc' } }}
                                    onFocus={() => setActiveEditor('desc')}
                                    className="h-full custom-quill-editor"
                                />
                            </div>
                        </div>

                        {opgave && (
                            <div className="mt-4 border-t pt-4">
                                <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <MessageSquare size={16} /> Kommentarer
                                </h3>
                                <div className="space-y-4 mb-4 max-h-60 overflow-y-auto px-1">
                                    {opgave.kommentarer?.map((k) => (
                                        <div key={k.id} className="bg-gray-50 p-3 rounded-lg text-sm border border-gray-100 group/comment">
                                            {editingCommentId === k.id ? (
                                                <div className="flex flex-col gap-2">
                                                    <div className="text-xs font-bold text-gray-500">Redigerer kommentar...</div>
                                                    <div className="bg-white border rounded-lg overflow-hidden">
                                                        <ReactQuill
                                                            theme="snow"
                                                            value={editingCommentText}
                                                            onChange={setEditingCommentText}
                                                            modules={{ toolbar: { container: '#toolbar-edit-comment' } }}
                                                            onFocus={() => setActiveEditor('edit-comment')}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => setEditingCommentId(null)}
                                                            className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-xs font-medium"
                                                        >
                                                            Annuller
                                                        </button>
                                                        <button
                                                            onClick={handleUpdateComment}
                                                            className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                                                        >
                                                            Gem ændringer
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                                                        <span className="font-bold">{k.bruger_details?.first_name || 'Ukendt'}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span>{new Date(k.oprettet).toLocaleString()}</span>
                                                            {currentUser?.id === k.bruger && (
                                                                <div className="flex gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingCommentId(k.id);
                                                                            setEditingCommentText(k.tekst);
                                                                            setActiveEditor('edit-comment');
                                                                        }}
                                                                        className="text-blue-600 hover:text-blue-800"
                                                                        title="Rediger"
                                                                    >
                                                                        <Edit size={12} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setCommentToDelete(k.id)}
                                                                        className="text-red-400 hover:text-red-600"
                                                                        title="Slet"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div
                                                        className="text-gray-800 prose prose-sm max-w-none [&>p]:mb-1 [&>img]:max-w-full [&>img]:rounded-lg"
                                                        dangerouslySetInnerHTML={{ __html: k.tekst }}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* New Comment Input */}
                                <div className="flex flex-col gap-2">
                                    <div className="bg-white border rounded-b-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20">
                                        <ReactQuill
                                            theme="snow"
                                            value={newComment}
                                            onChange={setNewComment}
                                            placeholder="Skriv en kommentar..."
                                            modules={{ toolbar: { container: '#toolbar-new-comment' } }}
                                            onFocus={() => setActiveEditor('new-comment')}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!newComment.trim() || newComment === '<p><br></p>'}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-blue-700 transition-colors"
                                        >
                                            Send Kommentar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Sidebar Metadata */}
                <div className="w-full lg:w-72 bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-4 h-full overflow-y-auto">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as OpgaveStatus)}
                            className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                        >
                            {Object.values(OpgaveStatus).map((s) => (
                                <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prioritet</label>
                        <select
                            value={prioritet}
                            onChange={(e) => setPrioritet(e.target.value as OpgavePriority)}
                            className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                        >
                            {Object.values(OpgavePriority).map((p) => (
                                <option key={p} value={p}>{PRIORITY_LABELS[p] || p}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Team</label>
                        <select
                            value={selectedTeamId || ''}
                            onChange={(e) => {
                                const val = e.target.value ? Number(e.target.value) : null;
                                setSelectedTeamId(val);
                                // Optional: Reset assignees that are not in the new team?
                                // For now, let's keep them but restrict new additions
                            }}
                            className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                        >
                            <option value="">Ingen Team</option>
                            {state.teams.map((t) => (
                                <option key={t.id} value={t.id}>{t.navn}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ansvarlige</label>
                        <div className="flex flex-col gap-2">
                            {/* Selected Users */}
                            <div className="flex flex-wrap gap-1">
                                {ansvarlige.map(id => {
                                    const user = users.find(u => u.id === id);
                                    if (!user) return null;
                                    return (
                                        <div key={id} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-bold border border-blue-100">
                                            <span>{user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.username}</span>
                                            <button
                                                onClick={() => setAnsvarlige(prev => prev.filter(p => p !== id))}
                                                className="hover:text-blue-900 rounded-full hover:bg-blue-200 p-0.5"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Add User Dropdown (Filtered by Team) */}
                            <select
                                value=""
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (val && !ansvarlige.includes(val)) {
                                        setAnsvarlige(prev => [...prev, val]);
                                    }
                                }}
                                className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                            >
                                <option value="">+ Tilføj ansvarlig</option>
                                {users
                                    .filter(u => u.is_active !== false)
                                    .filter(u => !ansvarlige.includes(u.id))
                                    .filter(u => !selectedTeamId || (u.teams && u.teams.some((t: Team) => t.id === selectedTeamId)))
                                    .sort((a, b) => (a.first_name || a.username).localeCompare(b.first_name || b.username))
                                    .map((u) => (
                                        <option key={u.id} value={u.id}>{u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.username}</option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Deadline</label>
                        <input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full px-3 py-2 bg-white border rounded-lg text-sm"
                        />
                    </div>

                    {/* Show creator if exists */}
                    {opgave?.oprettet_af_details && (
                        <div className="text-xs text-gray-400 text-center mt-1">
                            Oprettet af {opgave.oprettet_af_details.first_name || opgave.oprettet_af_details.username} • {new Date(opgave.oprettet).toLocaleDateString()}
                        </div>
                    )}

                    <div className="mt-auto pt-4 border-t flex flex-col gap-2">
                        <button
                            onClick={handleSave}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold shadow-sm hover:bg-blue-700 flex justify-center items-center gap-2"
                        >
                            <Save size={16} /> Gem Opgave
                        </button>


                        {opgave && (
                            <button
                                onClick={() => setConfirmArchiveTask(true)}
                                className="w-full py-2 bg-white text-orange-600 border border-orange-100 rounded-lg font-bold hover:bg-orange-50 flex justify-center items-center gap-2 text-sm"
                            >
                                <Archive size={16} /> Arkiver
                            </button>
                        )}

                        {opgave && (
                            <button
                                onClick={() => setConfirmDeleteTask(true)}
                                className="w-full py-2 bg-white text-red-600 border border-red-100 rounded-lg font-bold hover:bg-red-50 flex justify-center items-center gap-2 text-sm"
                            >
                                <Trash2 size={16} /> Slet
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmArchiveTask}
                onClose={() => setConfirmArchiveTask(false)}
                onConfirm={async () => {
                    if (opgave) {
                        await opgaveService.archive(opgave.id);
                        onSaved();
                        onClose();
                        showToast('Opgave arkiveret', 'success');
                    }
                }}
                title="Arkiver opgave"
                message="Er du sikker på at du vil arkivere denne opgave?"
                confirmText="Arkiver"
            />

            <ConfirmModal
                isOpen={confirmDeleteTask}
                onClose={() => setConfirmDeleteTask(false)}
                onConfirm={async () => {
                    if (opgave) {
                        await opgaveService.delete(opgave.id);
                        onSaved();
                        onClose();
                        showToast('Opgave slettet', 'success');
                    }
                }}
                title="Slet opgave"
                message="Er du sikker på at du vil slette denne opgave permanent?"
                confirmText="Slet"
                isDestructive={true}
            />

            <ConfirmModal
                isOpen={!!commentToDelete}
                onClose={() => setCommentToDelete(null)}
                onConfirm={async () => {
                    if (commentToDelete) {
                        await opgaveService.deleteComment(commentToDelete);
                        onSaved();
                        showToast('Kommentar slettet', 'success');
                    }
                }}
                title="Slet kommentar"
                message="Er du sikker på at du vil slette denne kommentar?"
                confirmText="Slet"
                isDestructive={true}
            />

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </Modal>
    );
};

export default TaskDetailModal;
