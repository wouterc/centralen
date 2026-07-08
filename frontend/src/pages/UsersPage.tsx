import React, { useState } from 'react';
import { useAppState } from '../StateContext';
import { api } from '../api';
import { Link } from 'react-router-dom';
import type { User, Team, UserRole } from '../types';
import {
    User as UserIcon,
    Users,
    Save,
    Trash2,
    Plus,
    UserPlus,
    MailPlus,
    ArrowLeft,
    Palette,
    Shield,
    ChevronLeft,
    ChevronRight,
    X,
    Check,
    UserX,
    Eye,
    EyeOff,
    Search,
    Layers
} from 'lucide-react';
import type { AarshjulGruppe } from '../types';
import ConfirmModal from '../components/ui/ConfirmModal';
import Toast, { type ToastType } from '../components/ui/Toast';
import { useTranslation } from '../services/translationService';

const UsersPage: React.FC = () => {
    const { state, refreshUsers, refreshTeams, refreshGrupper } = useAppState();
    const { t } = useTranslation();

    const ROLE_LEVELS = {
        'ADMIN': 3,
        'SUPERUSER': 2,
        'MEMBER': 1
    };

    const currentUserRole = state.currentUser?.role || 'MEMBER';
    const currentUserLevel = ROLE_LEVELS[currentUserRole];

    // Navigation & Layout State
    const [activeTab, setActiveTab] = useState<'users' | 'teams' | 'groups'>('users');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [openUserTeamId, setOpenUserTeamId] = useState<number | null>(null);
    const [openGroupTeamId, setOpenGroupTeamId] = useState<number | null>(null);
    const [teamSearchQuery, setTeamSearchQuery] = useState('');
    const [groupSearchQuery, setGroupSearchQuery] = useState('');
    const [userSearchQuery, setUserSearchQuery] = useState('');

    // User States
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<User>>({});
    const [isCreating, setIsCreating] = useState(false);
    const [showInactiveUsers, setShowInactiveUsers] = useState(false);
    const [newForm, setNewForm] = useState({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        role: 'MEMBER' as UserRole,
        color: '#3b82f6',
        password: ''
    });
    const [isInviting, setIsInviting] = useState(false);
    const [invitationForm, setInvitationForm] = useState({
        email: '',
        role: 'MEMBER' as UserRole
    });

    // Team States
    const [isCreatingTeam, setIsCreatingTeam] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamColor, setNewTeamColor] = useState('#3b82f6');
    const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
    const [editTeamForm, setEditTeamForm] = useState<Partial<Team>>({});

    // Team Member Management State
    const [managingTeamId, setManagingTeamId] = useState<number | null>(null);
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [tempTeamMembers, setTempTeamMembers] = useState<number[]>([]);

    // Group States
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupPriority, setNewGroupPriority] = useState(0);
    const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
    const [editGroupForm, setEditGroupForm] = useState<Partial<AarshjulGruppe>>({});

    // Modal & Toast states
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [userToToggleStatus, setUserToToggleStatus] = useState<User | null>(null);
    const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
    const [groupToDelete, setGroupToDelete] = useState<AarshjulGruppe | null>(null);
    const [membershipToRemove, setMembershipToRemove] = useState<{ team: Team, userId: number } | null>(null);

    const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
        message: '',
        type: 'info',
        isVisible: false
    });

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type, isVisible: true });
    };

    const handleEditStart = (user: User) => {
        setEditingUserId(user.id);
        setEditForm({ ...user });
    };

    const handleEditCancel = () => {
        setEditingUserId(null);
        setEditForm({});
    };

    const handleEditSave = async () => {
        if (!editingUserId) return;
        try {
            await api.patch(`/users/${editingUserId}/`, editForm);
            setEditingUserId(null);
            await refreshUsers();
            showToast('Bruger er gemt', 'success');
        } catch (e) {
            console.error(e);
            showToast('Kunne ikke gemme bruger', 'error');
        }
    };

    const handleCreate = async () => {
        try {
            await api.post('/users/', newForm);
            setIsCreating(false);
            setNewForm({
                username: '',
                first_name: '',
                last_name: '',
                email: '',
                role: 'MEMBER',
                color: '#3b82f6',
                password: ''
            });
            await refreshUsers();
            showToast('Bruger er oprettet', 'success');
        } catch (e: any) {
            console.error(e);
            showToast(`Kunne ikke oprette bruger: ${e.message || 'Ukendt fejl'}`, 'error');
        }
    };

    const handleInvite = async () => {
        try {
            await api.post('/invitations/', invitationForm);
            setIsInviting(false);
            setInvitationForm({
                email: '',
                role: 'MEMBER'
            });
            showToast('Invitation er sendt! Tjek terminalen for linket.', 'success');
        } catch (e: any) {
            console.error(e);
            showToast(`Kunne ikke sende invitation: ${e.message || 'Ukendt fejl'}`, 'error');
        }
    };

    const handleDelete = async (user: User) => {
        if (user.id === state.currentUser?.id) {
            showToast('Du kan ikke deaktivere eller slette dig selv mens du er logget ind.', 'error');
            return;
        }
        setUserToDelete(user);
    };

    const confirmDelete = async () => {
        if (!userToDelete || !state.activeWorkspaceId) return;
        const user = userToDelete;

        try {
            // Remove from current workspace instead of global delete/deactivate
            await api.post(`/companies/${state.activeWorkspaceId}/remove_member/`, { 
                user_id: user.id 
            });
            showToast(`Bruger ${user.username} er fjernet fra dette arbejdsrum`, 'success');
            await refreshUsers();
        } catch (e: any) {
            console.error(e);
            showToast(e.message || 'Kunne ikke fjerne bruger fra arbejdsrum', 'error');
        }
        setUserToDelete(null);
    };

    const toggleActive = (user: User) => {
        if (user.id === state.currentUser?.id) {
            showToast('Du kan ikke deaktivere dig selv.', 'error');
            return;
        }
        setUserToToggleStatus(user);
    };

    const confirmToggleActive = async () => {
        if (!userToToggleStatus) return;
        const user = userToToggleStatus;

        try {
            await api.patch(`/users/${user.id}/`, { is_active: !user.is_active });
            await refreshUsers();
            showToast(`Bruger ${user.username} er nu ${!user.is_active ? 'aktiv' : 'deaktiveret'}`, 'success');
        } catch (e) {
            console.error(e);
            showToast('Kunne ikke ændre status', 'error');
        }
        setUserToToggleStatus(null);
    };

    const handleQuickRoleChange = async (user: User, newRole: UserRole) => {
        try {
            await api.patch(`/users/${user.id}/`, { role: newRole });
            await refreshUsers();
            showToast(`Niveau ændret for ${user.username}`, 'success');
        } catch (e) {
            console.error(e);
            showToast('Kunne ikke skifte niveau', 'error');
        }
    };

    // Team Actions
    const handleCreateTeam = async () => {
        if (!newTeamName.trim()) return;
        try {
            await api.post('/teams/', { navn: newTeamName, color: newTeamColor, medlemmer: [] });
            setIsCreatingTeam(false);
            setNewTeamName('');
            setNewTeamColor('#3b82f6');
            await refreshTeams();
            showToast('Team er oprettet', 'success');
        } catch (e) {
            console.error(e);
            showToast('Kunne ikke oprette team', 'error');
        }
    };

    const handleTeamEditSave = async () => {
        if (!editingTeamId) return;
        try {
            await api.patch(`/teams/${editingTeamId}/`, {
                navn: editTeamForm.navn,
                color: editTeamForm.color
            });
            setEditingTeamId(null);
            await refreshTeams();
            showToast('Team er gemt', 'success');
        } catch (e) {
            console.error(e);
            showToast('Kunne ikke gemme team', 'error');
        }
    };

    const handleTeamDelete = (team: Team) => {
        setTeamToDelete(team);
    };

    const confirmTeamDelete = async () => {
        if (!teamToDelete) return;
        try {
            await api.delete(`/teams/${teamToDelete.id}/`);
            await refreshTeams();
            showToast(`Team ${teamToDelete.navn} er slettet`, 'success');
        } catch (e) {
            console.error(e);
            showToast('Kunne ikke slette team', 'error');
        }
        setTeamToDelete(null);
    };

    const handleOpenMemberManage = (team: Team) => {
        setManagingTeamId(team.id);
        setTempTeamMembers([...team.medlemmer]);
        setMemberSearchQuery('');
    };

    const handleSaveTeamMembers = async () => {
        if (!managingTeamId) return;
        try {
            await api.patch(`/teams/${managingTeamId}/`, { medlemmer: tempTeamMembers });
            setManagingTeamId(null);
            await refreshTeams();
            await refreshUsers();
            showToast('Medlemmer er gemt', 'success');
        } catch (e) {
            console.error(e);
            showToast('Kunne ikke gemme medlemmer', 'error');
        }
    };

    const toggleTempMember = (userId: number) => {
        if (tempTeamMembers.includes(userId)) {
            setTempTeamMembers(tempTeamMembers.filter(id => id !== userId));
        } else {
            setTempTeamMembers([...tempTeamMembers, userId]);
        }
    };

    const toggleMember = async (team: Team, userId: number, skipPrompt = false) => {
        const isMember = team.medlemmer.includes(userId);

        if (isMember && !skipPrompt) {
            setMembershipToRemove({ team, userId });
            return;
        }

        await performToggleMember(team, userId);
    };

    const confirmRemoveMember = async () => {
        if (!membershipToRemove) return;
        const { team, userId } = membershipToRemove;
        await performToggleMember(team, userId);
        setMembershipToRemove(null);
    };

    const performToggleMember = async (team: Team, userId: number) => {
        const isMember = team.medlemmer.includes(userId);
        const newMembers = isMember
            ? team.medlemmer.filter(id => id !== userId)
            : [...team.medlemmer, userId];

        try {
            await api.patch(`/teams/${team.id}/`, { medlemmer: newMembers });
            await refreshTeams();
            await refreshUsers();
            showToast(isMember ? 'Medlem fjernet' : 'Medlem tilføjet', 'success');
        } catch (e) {
            console.error(e);
            showToast('Kunne ikke opdatere team-medlemmer', 'error');
        }
    };

    // Group Actions
    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;
        try {
            await api.post('/aarshjul/grupper/', {
                navn: newGroupName,
                raekkefoelge: newGroupPriority,
                teams: []
            });
            setIsCreatingGroup(false);
            setNewGroupName('');
            setNewGroupPriority(0);
            await refreshGrupper();
            showToast('Gruppe er oprettet', 'success');
        } catch (e) {
            console.error(e);
            showToast('Kunne ikke oprette gruppe', 'error');
        }
    };

    const handleGroupEditSave = async () => {
        if (!editingGroupId) return;
        try {
            await api.patch(`/aarshjul/grupper/${editingGroupId}/`, editGroupForm);
            setEditingGroupId(null);
            await refreshGrupper();
            showToast('Gruppe er gemt', 'success');
        } catch (e) {
            console.error(e);
            showToast('Kunne ikke gemme gruppe', 'error');
        }
    };

    const handleGroupDelete = (group: AarshjulGruppe) => {
        setGroupToDelete(group);
    };

    const confirmGroupDelete = async () => {
        if (!groupToDelete) return;
        try {
            await api.delete(`/aarshjul/grupper/${groupToDelete.id}/`);
            await refreshGrupper();
            showToast(`Gruppe ${groupToDelete.navn} er slettet`, 'success');
        } catch (e) {
            console.error(e);
            showToast('Kunne ikke slette gruppe', 'error');
        }
        setGroupToDelete(null);
    };

    const toggleGroupTeam = async (group: AarshjulGruppe, teamId: number) => {
        const hasTeam = group.teams.includes(teamId);
        const newTeams = hasTeam
            ? group.teams.filter(id => id !== teamId)
            : [...group.teams, teamId];

        try {
            await api.patch(`/aarshjul/grupper/${group.id}/`, { teams: newTeams });
            await refreshGrupper();
            showToast(hasTeam ? 'Team fjernet fra gruppe' : 'Team tilføjet til gruppe', 'success');
        } catch (e) {
            console.error(e);
            showToast('Kunne ikke opdatere gruppe-teams', 'error');
        }
    };

    const filteredUsers = state.users.filter(u => {
        const matchesStatus = showInactiveUsers || u.is_active;
        if (!matchesStatus) return false;

        if (!userSearchQuery) return true;

        const query = userSearchQuery.toLowerCase();

        // Match username, first name, last name
        const matchName =
            u.username?.toLowerCase().includes(query) ||
            u.first_name?.toLowerCase().includes(query) ||
            u.last_name?.toLowerCase().includes(query);

        // Match teams
        const userTeams = state.teams.filter(t => t.medlemmer.includes(u.id));
        const matchTeam = userTeams.some(t => t.navn.toLowerCase().includes(query));

        return matchName || matchTeam;
    });

    const roles = {
        ADMIN: { label: 'Administrator', color: 'bg-red-50 text-red-700 border-red-100' },
        SUPERUSER: { label: 'Superbruger', color: 'bg-orange-50 text-orange-700 border-orange-100' },
        MEMBER: { label: 'Medlem', color: 'bg-green-50 text-green-700 border-green-100' },
    };

    return (
        <div className="h-full flex-1 flex bg-gray-300 overflow-hidden">
            {/* Left Sidebar Menu */}
            <div className={`bg-gray-900 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
                <div className="h-14 flex items-center px-4 border-b border-gray-800 shrink-0">
                    {!sidebarCollapsed && <span className="font-black text-white text-lg tracking-tight truncate">{t('users.admin_panel', 'Admin Panel')}</span>}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className={`text-gray-400 hover:text-white transition-colors ${sidebarCollapsed ? 'mx-auto' : 'ml-auto'}`}
                    >
                        {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                <div className="flex-1 py-4 flex flex-col gap-1 px-2">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <UserIcon size={20} className="shrink-0" />
                        {!sidebarCollapsed && <span>{t('users.users_menu', 'Users')}</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('teams')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm ${activeTab === 'teams' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <Shield size={20} className="shrink-0" />
                        {!sidebarCollapsed && <span>{t('users.teams_menu', 'Teams')}</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm ${activeTab === 'groups' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <Layers size={20} className="shrink-0" />
                        {!sidebarCollapsed && <span>{t('users.groups_menu', 'Annual Cycle Groups')}</span>}
                    </button>

                    <div className="mt-auto pt-4 border-t border-gray-800">
                        <Link
                            to="/"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all font-bold text-sm"
                        >
                            <ArrowLeft size={20} className="shrink-0" />
                            {!sidebarCollapsed && <span>{t('users.back_to_board', 'Back to Board')}</span>}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-300 border-l border-gray-200">
                <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-6 flex-1">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 shrink-0">
                            {activeTab === 'users' && <Users className="text-blue-600" size={24} />}
                            {activeTab === 'teams' && <Shield className="text-indigo-600" size={24} />}
                            {activeTab === 'groups' && <Layers className="text-emerald-600" size={24} />}
                            {t('users.title', 'Users & Teams')}
                        </h2>

                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder={activeTab === 'users' ? t('users.search_users', "Search for users or teams...") : activeTab === 'teams' ? t('users.search_teams', "Search for team...") : t('users.search_groups', "Search for group...")}
                                value={activeTab === 'users' ? userSearchQuery : activeTab === 'teams' ? teamSearchQuery : groupSearchQuery}
                                onChange={e => {
                                    if (activeTab === 'users') setUserSearchQuery(e.target.value);
                                    else if (activeTab === 'teams') setTeamSearchQuery(e.target.value);
                                    else setGroupSearchQuery(e.target.value);
                                }}
                                className="w-full pl-10 pr-10 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                            {(activeTab === 'users' ? userSearchQuery : activeTab === 'teams' ? teamSearchQuery : groupSearchQuery) && (
                                <button
                                    onClick={() => {
                                        if (activeTab === 'users') setUserSearchQuery('');
                                        else if (activeTab === 'teams') setTeamSearchQuery('');
                                        else setGroupSearchQuery('');
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {activeTab === 'users' && (
                            <>
                                <button
                                    onClick={() => setShowInactiveUsers(!showInactiveUsers)}
                                    className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 border transition-all ${showInactiveUsers ? 'bg-gray-100 border-gray-300 text-gray-700' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'}`}
                                >
                                    {showInactiveUsers ? <Eye size={16} /> : <EyeOff size={16} />}
                                    {showInactiveUsers ? 'Viser Alle' : 'Kun Aktive'}
                                </button>
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded-lg font-black text-sm flex items-center gap-2 hover:bg-blue-50 transition shadow-sm hover:shadow-md active:scale-95"
                                >
                                    <UserPlus size={18} />
                                    Ny Bruger
                                </button>
                                <button
                                    onClick={() => setIsInviting(true)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-black text-sm flex items-center gap-2 hover:bg-blue-700 transition shadow-sm hover:shadow-md active:scale-95"
                                >
                                    <MailPlus size={18} />
                                    Inviter Medlem
                                </button>
                            </>
                        )}
                        {activeTab === 'teams' && (
                            <button
                                onClick={() => setIsCreatingTeam(true)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-black text-sm flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm hover:shadow-md active:scale-95"
                            >
                                <Shield size={18} />
                                Nyt Team
                            </button>
                        )}
                        {activeTab === 'groups' && (
                            <button
                                onClick={() => setIsCreatingGroup(true)}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-black text-sm flex items-center gap-2 hover:bg-emerald-700 transition shadow-sm hover:shadow-md active:scale-95"
                            >
                                <Plus size={18} />
                                Ny Gruppe
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-6xl mx-auto min-h-full">

                        {/* VIEW: USERS */}
                        {activeTab === 'users' && (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                {/* Create User Form Overlay/Header */}
                                {isCreating && (currentUserLevel >= ROLE_LEVELS.SUPERUSER) && (
                                    <div className="bg-white border-2 border-blue-500 rounded-2xl p-6 shadow-xl mb-8 slide-in-from-top-4 animate-in">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-black text-blue-900 flex items-center gap-2">
                                                <UserPlus className="text-blue-600" /> Opret Ny Bruger
                                            </h3>
                                            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-blue-600 uppercase">Brugernavn*</label>
                                                <input
                                                    type="text"
                                                    value={newForm.username}
                                                    onChange={e => setNewForm({ ...newForm, username: e.target.value })}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
                                                    placeholder="Brugernavn"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-blue-600 uppercase">Password*</label>
                                                <input
                                                    type="password"
                                                    value={newForm.password}
                                                    onChange={e => setNewForm({ ...newForm, password: e.target.value })}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
                                                    placeholder="******"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-blue-600 uppercase">Email</label>
                                                <input
                                                    type="email"
                                                    value={newForm.email}
                                                    onChange={e => setNewForm({ ...newForm, email: e.target.value })}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-blue-600 uppercase">Fornavn</label>
                                                <input
                                                    type="text"
                                                    value={newForm.first_name}
                                                    onChange={e => setNewForm({ ...newForm, first_name: e.target.value })}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-blue-600 uppercase">Efternavn</label>
                                                <input
                                                    type="text"
                                                    value={newForm.last_name}
                                                    onChange={e => setNewForm({ ...newForm, last_name: e.target.value })}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-blue-600 uppercase">Farve</label>
                                                <input
                                                    type="color"
                                                    value={newForm.color}
                                                    onChange={e => setNewForm({ ...newForm, color: e.target.value })}
                                                    className="w-full h-9 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-blue-600 uppercase">Niveau</label>
                                                <select
                                                    value={newForm.role}
                                                    onChange={e => setNewForm({ ...newForm, role: e.target.value as UserRole })}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white cursor-pointer"
                                                >
                                                    <option value="MEMBER">Medlem</option>
                                                    {currentUserLevel >= ROLE_LEVELS.SUPERUSER && <option value="SUPERUSER">Superbruger</option>}
                                                    {currentUserLevel >= ROLE_LEVELS.ADMIN && <option value="ADMIN">Administrator</option>}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mt-6 flex justify-end gap-3">
                                            <button onClick={() => setIsCreating(false)} className="px-6 py-2 text-gray-500 hover:text-gray-700 font-bold text-sm">Annuller</button>
                                            <button
                                                onClick={handleCreate}
                                                disabled={!newForm.username || !newForm.password}
                                                className="px-8 py-2 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 transition-all active:scale-95"
                                            >
                                                Opret Bruger
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Invitation Modal */}
                                {isInviting && (currentUserLevel >= ROLE_LEVELS.SUPERUSER) && (
                                    <div className="bg-white border-2 border-indigo-500 rounded-2xl p-6 shadow-xl mb-8 slide-in-from-top-4 animate-in">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-black text-indigo-900 flex items-center gap-2">
                                                <MailPlus className="text-indigo-600" /> Inviter nyt medlem via e-mail
                                            </h3>
                                            <button onClick={() => setIsInviting(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-indigo-600 uppercase">Email*</label>
                                                <input
                                                    type="email"
                                                    value={invitationForm.email}
                                                    onChange={e => setInvitationForm({ ...invitationForm, email: e.target.value })}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white"
                                                    placeholder="bruger@eksempel.dk"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-indigo-600 uppercase">Fremtidig Rolle</label>
                                                <select
                                                    value={invitationForm.role}
                                                    onChange={e => setInvitationForm({ ...invitationForm, role: e.target.value as UserRole })}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white cursor-pointer"
                                                >
                                                    <option value="MEMBER">Medlem</option>
                                                    {currentUserLevel >= ROLE_LEVELS.SUPERUSER && <option value="SUPERUSER">Superbruger</option>}
                                                    {currentUserLevel >= ROLE_LEVELS.ADMIN && <option value="ADMIN">Administrator</option>}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mt-6 flex justify-end gap-3">
                                            <button onClick={() => setIsInviting(false)} className="px-6 py-2 text-gray-500 hover:text-gray-700 font-bold text-sm">Annuller</button>
                                            <button
                                                onClick={handleInvite}
                                                disabled={!invitationForm.email}
                                                className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all active:scale-95"
                                            >
                                                Send Invitation
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* User Table Area */}
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Bruger</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Niveau</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Teams</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Handlinger</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredUsers.map(user => {
                                                const isEditing = editingUserId === user.id;
                                                const role = roles[(isEditing ? editForm.role : user.role) || 'MEMBER'];
                                                const canEditThisUser = currentUserLevel >= ROLE_LEVELS.SUPERUSER || user.id === state.currentUser?.id;

                                                return (
                                                    <tr
                                                        key={user.id}
                                                        onClick={() => canEditThisUser && !isEditing && handleEditStart(user)}
                                                        className={`${isEditing ? 'bg-blue-50/30 font-semibold' : 'hover:bg-gray-50/30'} transition-all ${user.is_active ? '' : 'opacity-60'} ${openUserTeamId === user.id ? 'z-30 relative' : ''} cursor-pointer border-b-2 border-transparent hover:border-blue-500 active:bg-blue-50`}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="relative group shrink-0">
                                                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-lg" style={{ backgroundColor: (isEditing ? editForm.color : user.color) || '#3b82f6' }}>
                                                                        {(isEditing ? (editForm.first_name || editForm.username) : (user.first_name || user.username))?.substring(0, 1).toUpperCase()}
                                                                    </div>
                                                                    {isEditing && (
                                                                        <div className="absolute -top-1 -right-1">
                                                                            <input
                                                                                type="color"
                                                                                value={editForm.color || '#3b82f6'}
                                                                                onChange={e => setEditForm({ ...editForm, color: e.target.value })} onClick={e => e.stopPropagation()}
                                                                                className="w-5 h-5 rounded-full border-2 border-white shadow-sm cursor-pointer p-0 overflow-hidden"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col min-w-0 flex-1">
                                                                    <div className="flex flex-col gap-1">
                                                                        {isEditing ? (
                                                                            <div className="grid grid-cols-2 gap-2 mb-1">
                                                                                <div className="flex flex-col gap-0.5">
                                                                                    <label className="text-[8px] font-black text-blue-600 uppercase">Brugernavn</label>
                                                                                    <input
                                                                                        value={editForm.username || ''}
                                                                                        onChange={e => setEditForm({ ...editForm, username: e.target.value })} onClick={e => e.stopPropagation()}
                                                                                        className="font-bold text-gray-800 bg-white border border-blue-200 rounded px-2 py-0.5 text-xs outline-none focus:ring-2 focus:ring-blue-400"
                                                                                    />
                                                                                </div>
                                                                                <div className="flex flex-col gap-0.5">
                                                                                    <label className="text-[8px] font-black text-blue-600 uppercase">Nyt Password</label>
                                                                                    <input
                                                                                        type="password"
                                                                                        placeholder="Skift?"
                                                                                        onChange={e => setEditForm({ ...editForm, password: e.target.value })} onClick={e => e.stopPropagation()}
                                                                                        className="font-bold text-gray-800 bg-white border border-blue-200 rounded px-2 py-0.5 text-xs outline-none focus:ring-2 focus:ring-blue-400"
                                                                                    />
                                                                                </div>
                                                                                <div className="flex flex-col gap-0.5">
                                                                                    <label className="text-[8px] font-black text-blue-600 uppercase">Fornavn</label>
                                                                                    <input
                                                                                        value={editForm.first_name || ''}
                                                                                        onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} onClick={e => e.stopPropagation()}
                                                                                        className="font-bold text-gray-800 bg-white border border-blue-200 rounded px-2 py-0.5 text-xs outline-none focus:ring-2 focus:ring-blue-400"
                                                                                    />
                                                                                </div>
                                                                                <div className="flex flex-col gap-0.5">
                                                                                    <label className="text-[8px] font-black text-blue-600 uppercase">Efternavn</label>
                                                                                    <input
                                                                                        value={editForm.last_name || ''}
                                                                                        onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} onClick={e => e.stopPropagation()}
                                                                                        className="font-bold text-gray-800 bg-white border border-blue-200 rounded px-2 py-0.5 text-xs outline-none focus:ring-2 focus:ring-blue-400"
                                                                                    />
                                                                                </div>
                                                                                <div className="flex flex-col gap-0.5 col-span-2">
                                                                                    <label className="text-[8px] font-black text-blue-600 uppercase">Email</label>
                                                                                    <input
                                                                                        value={editForm.email || ''}
                                                                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })} onClick={e => e.stopPropagation()}
                                                                                        className="font-bold text-gray-800 bg-white border border-blue-200 rounded px-2 py-0.5 text-xs outline-none focus:ring-2 focus:ring-blue-400"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-bold text-gray-800 truncate">{user.username}</span>
                                                                                {(user.first_name || user.last_name) && (
                                                                                    <span className="text-gray-400 text-[10px] font-medium truncate">
                                                                                        ({`${user.first_name || ''} ${user.last_name || ''}`.trim()})
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {!isEditing && <span className="text-xs text-gray-400 truncate">{user.email || 'Ingen email'}</span>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                                            {currentUserLevel >= ROLE_LEVELS.SUPERUSER && (user.id !== state.currentUser?.id || currentUserRole === 'SUPERUSER') ? (
                                                                <select
                                                                    value={isEditing ? editForm.role : user.role}
                                                                    onChange={e => {
                                                                        const nr = e.target.value as UserRole;
                                                                        if (isEditing) {
                                                                            setEditForm({ ...editForm, role: nr });
                                                                        } else {
                                                                            handleQuickRoleChange(user, nr);
                                                                        }
                                                                    }}
                                                                    className="text-xs font-bold px-3 py-1 bg-white border border-blue-200 rounded-lg outline-none cursor-pointer hover:border-blue-400 transition-all"
                                                                >
                                                                    <option value="MEMBER">Medlem</option>
                                                                    {currentUserLevel >= ROLE_LEVELS.SUPERUSER && (user.id !== state.currentUser?.id || currentUserRole === 'SUPERUSER') && <option value="SUPERUSER">Superbruger</option>}
                                                                    {currentUserLevel >= ROLE_LEVELS.ADMIN && (user.id !== state.currentUser?.id || currentUserRole === 'ADMIN') && <option value="ADMIN">Administrator</option>}
                                                                </select>
                                                            ) : (
                                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${role.color}`}>
                                                                    {role.label}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="relative flex flex-wrap gap-1 items-center min-w-[120px]">
                                                                {/* The + Button for adding/toggling teams */}
                                                                {currentUserLevel >= ROLE_LEVELS.SUPERUSER && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setOpenUserTeamId(openUserTeamId === user.id ? null : user.id); }}
                                                                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-sm border ${openUserTeamId === user.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}`}
                                                                        title="Tildel teams"
                                                                    >
                                                                        <Plus size={14} className={openUserTeamId === user.id ? 'rotate-45' : ''} />
                                                                    </button>
                                                                )}

                                                                {/* Selected Teams as Badges */}
                                                                <div className="flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
                                                                    {state.teams.filter(t => t.medlemmer.includes(user.id)).map(team => (
                                                                        <span
                                                                            key={team.id}
                                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold shadow-sm"
                                                                            style={{
                                                                                backgroundColor: `${team.color || '#3b82f6'}10`,
                                                                                borderColor: `${team.color || '#3b82f6'}30`,
                                                                                color: team.color || '#3b82f6'
                                                                            }}
                                                                        >
                                                                            {team.navn}
                                                                            {currentUserLevel >= ROLE_LEVELS.SUPERUSER && (
                                                                                <button
                                                                                    onClick={() => toggleMember(team, user.id)}
                                                                                    className="p-0.5 hover:opacity-70 transition-opacity"
                                                                                    title="Fjern fra team"
                                                                                    style={{ color: team.color || '#3b82f6' }}
                                                                                >
                                                                                    <Plus size={8} className="rotate-45" />
                                                                                </button>
                                                                            )}
                                                                        </span>
                                                                    ))}
                                                                </div>

                                                                {/* Modal Teams Dropdown */}
                                                                {openUserTeamId === user.id && (
                                                                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
                                                                        {/* Backdrop */}
                                                                        <div
                                                                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                                                                            onClick={() => { setOpenUserTeamId(null); setTeamSearchQuery(''); }}
                                                                        />
                                                                        {/* Modal */}
                                                                        <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 animate-in zoom-in-95 duration-200">
                                                                            <div className="flex justify-between items-center mb-4">
                                                                                <div>
                                                                                    <h3 className="text-lg font-black text-gray-800 tracking-tight">Tildel Teams</h3>
                                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">For {user.username}</p>
                                                                                </div>
                                                                                <button
                                                                                    onClick={() => { setOpenUserTeamId(null); setTeamSearchQuery(''); }}
                                                                                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                                                                                >
                                                                                    <X size={18} className="text-gray-400" />
                                                                                </button>
                                                                            </div>

                                                                            <div className="relative mb-4">
                                                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Søg efter team..."
                                                                                    value={teamSearchQuery}
                                                                                    onChange={e => setTeamSearchQuery(e.target.value)}
                                                                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                                                                    autoFocus
                                                                                />
                                                                            </div>

                                                                            <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar -mx-1 px-1">
                                                                                {state.teams.filter(t => t.navn.toLowerCase().includes(teamSearchQuery.toLowerCase())).length === 0 && (
                                                                                    <div className="text-xs text-gray-400 italic py-6 text-center bg-gray-50/50 rounded-xl">
                                                                                        Ingen teams fundet
                                                                                    </div>
                                                                                )}
                                                                                {state.teams
                                                                                    .filter(t => t.navn.toLowerCase().includes(teamSearchQuery.toLowerCase()))
                                                                                    .map(team => {
                                                                                        const isMember = team.medlemmer.includes(user.id);
                                                                                        return (
                                                                                            <button
                                                                                                key={team.id}
                                                                                                onClick={() => toggleMember(team, user.id, true)}
                                                                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${isMember ? '' : 'hover:bg-gray-50 text-gray-600'}`}
                                                                                                style={isMember ? { backgroundColor: `${team.color || '#3b82f6'}15`, color: team.color || '#3b82f6' } : {}}
                                                                                            >
                                                                                                <span>{team.navn}</span>
                                                                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${isMember ? 'text-white' : 'border-gray-200'}`} style={isMember ? { backgroundColor: team.color || '#3b82f6', borderColor: team.color || '#3b82f6' } : {}}>
                                                                                                    {isMember && <Check size={10} strokeWidth={4} />}
                                                                                                </div>
                                                                                            </button>
                                                                                        );
                                                                                    })}
                                                                            </div>

                                                                            <button
                                                                                onClick={() => { setOpenUserTeamId(null); setTeamSearchQuery(''); }}
                                                                                className="w-full mt-4 py-2.5 bg-gray-900 text-white rounded-xl font-black text-xs hover:bg-gray-800 transition-all active:scale-[0.98]"
                                                                            >
                                                                                Færdig
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                                            <button
                                                                onClick={() => toggleActive(user)}
                                                                disabled={currentUserLevel < ROLE_LEVELS.SUPERUSER}
                                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black transition-all ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'} ${currentUserLevel < ROLE_LEVELS.SUPERUSER ? 'cursor-default' : 'hover:opacity-80'}`}
                                                            >
                                                                {user.is_active ? <Check size={12} /> : <X size={12} />}
                                                                {user.is_active ? 'AKTIV' : 'DEAKTIVERET'}
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end items-center gap-1">
                                                                {isEditing ? (
                                                                    <div className="flex gap-1 animate-in zoom-in-50 duration-200">
                                                                        <button onClick={handleEditCancel} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><X size={18} /></button>
                                                                        <button onClick={handleEditSave} className="p-2 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"><Save size={18} /></button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex gap-1">
                                                                        {canEditThisUser && (
                                                                            <button onClick={() => handleEditStart(user)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Rediger">
                                                                                <Palette size={18} />
                                                                            </button>
                                                                        )}
                                                                        {currentUserLevel >= ROLE_LEVELS.SUPERUSER && (
                                                                            <button
                                                                                onClick={() => handleDelete(user)}
                                                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                                title={user.is_active ? 'Deaktiver' : 'Slet permanent'}
                                                                            >
                                                                                {user.is_active ? <UserX size={18} /> : <Trash2 size={18} />}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* VIEW: TEAMS */}
                        {activeTab === 'teams' && (
                            <div className="animate-in fade-in duration-500 space-y-8">
                                {isCreatingTeam && (
                                    <div className="bg-white border-2 border-indigo-500 rounded-2xl p-6 shadow-xl slide-in-from-top-4 animate-in">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-black text-indigo-900 flex items-center gap-2">
                                                <Shield className="text-indigo-600" /> Opret Nyt Team
                                            </h3>
                                            <button onClick={() => setIsCreatingTeam(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                                        </div>
                                        <div className="flex gap-4">
                                            <input
                                                type="text"
                                                value={newTeamName}
                                                onChange={e => setNewTeamName(e.target.value)}
                                                className="flex-1 px-4 py-2 bg-gray-50 border border-indigo-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                placeholder="Indtast navn på teamet..."
                                                autoFocus
                                            />
                                            <div className="flex flex-col gap-1 shrink-0">
                                                <label className="text-[8px] font-black text-indigo-600 uppercase">Farve</label>
                                                <input
                                                    type="color"
                                                    value={newTeamColor}
                                                    onChange={e => setNewTeamColor(e.target.value)}
                                                    className="w-12 h-9 bg-gray-50 border border-indigo-100 rounded-xl cursor-pointer p-1"
                                                />
                                            </div>
                                            <button
                                                onClick={handleCreateTeam}
                                                disabled={!newTeamName.trim()}
                                                className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all active:scale-95 self-end h-9"
                                            >
                                                Gem Team
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {state.teams.filter(t => t.navn.toLowerCase().includes(teamSearchQuery.toLowerCase())).map(team => {
                                        const isEditing = editingTeamId === team.id;
                                        return (
                                            <div key={team.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group transition-all hover:shadow-lg hover:border-indigo-100">
                                                <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                                                    {isEditing ? (
                                                        <div className="flex gap-2 items-center flex-1 mr-2">
                                                            <input
                                                                value={editTeamForm.navn || ''}
                                                                onChange={e => setEditTeamForm({ ...editTeamForm, navn: e.target.value })}
                                                                onClick={e => e.stopPropagation()}
                                                                className="bg-white border border-indigo-200 rounded px-2 py-1 text-sm font-bold flex-1 outline-none focus:ring-2 focus:ring-indigo-400"
                                                            />
                                                            <input
                                                                type="color"
                                                                value={editTeamForm.color || '#3b82f6'}
                                                                onChange={e => setEditTeamForm({ ...editTeamForm, color: e.target.value })}
                                                                onClick={e => e.stopPropagation()}
                                                                className="w-8 h-8 rounded-lg border border-indigo-200 cursor-pointer p-1"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: team.color || '#3b82f6' }} />
                                                            <span className="font-black text-gray-800 tracking-tight">{team.navn}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex gap-1 shrink-0">
                                                        {isEditing ? (
                                                            <button onClick={handleTeamEditSave} className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700"><Save size={14} /></button>
                                                        ) : (
                                                            <button onClick={() => { setEditingTeamId(team.id); setEditTeamForm(team); }} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"><Palette size={14} /></button>
                                                        )}
                                                        <button onClick={() => handleTeamDelete(team)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"><Trash2 size={14} /></button>
                                                    </div>
                                                </div>
                                                <div
                                                    className="p-6 flex-1 cursor-pointer hover:bg-gray-50/80 transition-all group/members"
                                                    onClick={() => handleOpenMemberManage(team)}
                                                >
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Medlemmer</div>
                                                        <div className="text-gray-300 group-hover/members:text-indigo-500 transition-colors">
                                                            <Palette size={14} />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {team.medlemmer.map(uid => {
                                                            const u = state.users.find(x => x.id === uid);
                                                            if (!u) return null;
                                                            return (
                                                                <div
                                                                    key={uid}
                                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors shadow-sm"
                                                                    style={{
                                                                        backgroundColor: `${team.color || '#3b82f6'}10`,
                                                                        borderColor: `${team.color || '#3b82f6'}30`,
                                                                        color: team.color || '#3b82f6'
                                                                    }}
                                                                >
                                                                    <span>{u.username}</span>
                                                                </div>
                                                            );
                                                        })}
                                                        {team.medlemmer.length === 0 && <span className="text-xs text-gray-300 italic">Ingen medlemmer endnu...</span>}
                                                    </div>
                                                </div>
                                                <div className="px-6 py-3 bg-gray-50/30 border-t border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    {team.medlemmer.length} MEDLEMMER
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Team Member Management Modal */}
                                {managingTeamId && (
                                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                                        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setManagingTeamId(null)} />
                                        <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                                            {/* Header */}
                                            <div className="flex justify-between items-center mb-6 shrink-0">
                                                <div>
                                                    <h3 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                                                        <Users className="text-indigo-600" />
                                                        Administrer Medlemmer
                                                    </h3>
                                                    <p className="text-gray-500 font-medium">
                                                        {state.teams.find(t => t.id === managingTeamId)?.navn}
                                                    </p>
                                                </div>
                                                <button onClick={() => setManagingTeamId(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                                    <X size={24} className="text-gray-400" />
                                                </button>
                                            </div>

                                            {/* Search */}
                                            <div className="relative mb-6 shrink-0">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="Søg efter brugere..."
                                                    value={memberSearchQuery}
                                                    onChange={e => setMemberSearchQuery(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                                    autoFocus
                                                />
                                            </div>

                                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                                                {/* Selected Members */}
                                                <div>
                                                    <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                        Valgte Medlemmer
                                                        <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[10px]">{tempTeamMembers.length}</span>
                                                    </div>
                                                    {tempTeamMembers.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {tempTeamMembers.map(uid => {
                                                                const user = state.users.find(u => u.id === uid);
                                                                if (!user) return null;
                                                                return (
                                                                    <button
                                                                        key={uid}
                                                                        onClick={() => toggleTempMember(uid)}
                                                                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 text-sm font-bold hover:bg-red-50 hover:border-red-100 hover:text-red-700 transition-all group"
                                                                    >
                                                                        <div className="w-6 h-6 rounded-lg bg-indigo-200 flex items-center justify-center text-[10px] text-indigo-800 font-black group-hover:bg-red-200 group-hover:text-red-800">
                                                                            {user.username.substring(0, 1).toUpperCase()}
                                                                        </div>
                                                                        <span>{user.username}</span>
                                                                        <X size={14} className="ml-1 opacity-50 group-hover:opacity-100" />
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center border border-dashed border-gray-200">
                                                            Ingen medlemmer valgt
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Available Users */}
                                                <div>
                                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Tilgængelige Brugere</div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {state.users
                                                            .filter(u => !tempTeamMembers.includes(u.id)) // Exclude already selected
                                                            .filter(u => u.username.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                                                                u.first_name?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                                                                u.last_name?.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                                                            .map(user => (
                                                                <button
                                                                    key={user.id}
                                                                    onClick={() => toggleTempMember(user.id)}
                                                                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left group"
                                                                >
                                                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors" style={{ backgroundColor: user.color || undefined, color: user.color ? '#fff' : undefined }}>
                                                                        {user.username.substring(0, 1).toUpperCase()}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-bold text-gray-800 text-sm truncate">{user.username}</div>
                                                                        {(user.first_name || user.last_name) && (
                                                                            <div className="text-xs text-gray-400 truncate">{user.first_name} {user.last_name}</div>
                                                                        )}
                                                                    </div>
                                                                    <Plus size={16} className="text-gray-300 group-hover:text-indigo-600" />
                                                                </button>
                                                            ))}
                                                        {state.users.filter(u => !tempTeamMembers.includes(u.id)).length === 0 && (
                                                            <div className="col-span-full text-sm text-gray-400 italic text-center py-4">
                                                                Alle brugere er valgt
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                                                <button
                                                    onClick={() => setManagingTeamId(null)}
                                                    className="px-6 py-2.5 text-gray-500 hover:text-gray-700 font-bold text-sm hover:bg-gray-50 rounded-xl transition-colors"
                                                >
                                                    Annuller
                                                </button>
                                                <button
                                                    onClick={handleSaveTeamMembers}
                                                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
                                                >
                                                    <Save size={16} />
                                                    Gem Ændringer
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                )}

                            </div>
                        )}

                        {/* VIEW: GROUPS */}
                        {activeTab === 'groups' && (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                {/* Create Group Form */}
                                {isCreatingGroup && (
                                    <div className="bg-white border-2 border-emerald-500 rounded-2xl p-6 shadow-xl mb-8 slide-in-from-top-4 animate-in">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-black text-emerald-900 flex items-center gap-2">
                                                <Layers className="text-emerald-600" /> Opret Ny Årshjul Gruppe
                                            </h3>
                                            <button onClick={() => setIsCreatingGroup(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-emerald-600 uppercase">Gruppenavn*</label>
                                                <input
                                                    type="text"
                                                    value={newGroupName}
                                                    onChange={e => setNewGroupName(e.target.value)}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all focus:bg-white font-bold"
                                                    placeholder="F.eks. Strategi, Drift, Marketing..."
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-emerald-600 uppercase">Prioritet (Rækkefølge)</label>
                                                <input
                                                    type="number"
                                                    value={newGroupPriority}
                                                    onChange={e => setNewGroupPriority(parseInt(e.target.value) || 0)}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all focus:bg-white font-bold"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-6 flex justify-end gap-3">
                                            <button onClick={() => setIsCreatingGroup(false)} className="px-6 py-2 text-gray-500 hover:text-gray-700 font-bold text-sm">Annuller</button>
                                            <button
                                                onClick={handleCreateGroup}
                                                disabled={!newGroupName.trim()}
                                                className="px-8 py-2 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-200 disabled:opacity-50 transition-all active:scale-95"
                                            >
                                                Opret Gruppe
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Groups List */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {state.aarshjulGrupper
                                        .filter(g => !groupSearchQuery || g.navn.toLowerCase().includes(groupSearchQuery.toLowerCase()))
                                        .map(group => {
                                            const isEditing = editingGroupId === group.id;
                                            return (
                                                <div key={group.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow group/card">
                                                    <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                                                        <div className="flex justify-between items-start">
                                                            {isEditing ? (
                                                                <div className="flex-1 space-y-3 pr-4">
                                                                    <input
                                                                        value={editGroupForm.navn || ''}
                                                                        onChange={e => setEditGroupForm({ ...editGroupForm, navn: e.target.value })}
                                                                        className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                                                    />
                                                                    <div className="flex items-center gap-3">
                                                                        <label className="text-[10px] font-black text-emerald-600 uppercase">Prioritet:</label>
                                                                        <input
                                                                            type="number"
                                                                            value={editGroupForm.raekkefoelge || 0}
                                                                            onChange={e => setEditGroupForm({ ...editGroupForm, raekkefoelge: parseInt(e.target.value) || 0 })}
                                                                            className="w-20 px-3 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-black text-gray-800 text-lg tracking-tight">{group.navn}</span>
                                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[10px] font-black rounded-lg uppercase">Prio: {group.raekkefoelge}</span>
                                                                    </div>
                                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Årshjul Gruppe</span>
                                                                </div>
                                                            )}
                                                            <div className="flex gap-1">
                                                                {isEditing ? (
                                                                    <>
                                                                        <button onClick={() => setEditingGroupId(null)} className="p-2 text-gray-400 hover:text-gray-600"><X size={20} /></button>
                                                                        <button onClick={handleGroupEditSave} className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200"><Save size={20} /></button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingGroupId(group.id);
                                                                                setEditGroupForm({ ...group });
                                                                            }}
                                                                            className="p-2 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                                                        >
                                                                            <Palette size={20} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleGroupDelete(group)}
                                                                            className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                                        >
                                                                            <Trash2 size={20} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-6 flex-1">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tilknyttede Teams</div>
                                                            <button
                                                                onClick={() => setOpenGroupTeamId(group.id)}
                                                                className="text-emerald-600 hover:text-emerald-700 transition-colors"
                                                            >
                                                                <Plus size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {group.teams_detail?.map(team => (
                                                                <div
                                                                    key={team.id}
                                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors shadow-sm"
                                                                    style={{
                                                                        backgroundColor: `${team.color || '#3b82f6'}10`,
                                                                        borderColor: `${team.color || '#3b82f6'}30`,
                                                                        color: team.color || '#3b82f6'
                                                                    }}
                                                                >
                                                                    <span>{team.navn}</span>
                                                                    <button
                                                                        onClick={() => toggleGroupTeam(group, team.id)}
                                                                        className="hover:opacity-60"
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            {(!group.teams_detail || group.teams_detail.length === 0) && (
                                                                <span className="text-xs text-gray-300 italic">Ingen teams tilknyttet endnu...</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>

                                {/* Group Team Management Popup (Modal-ish) */}
                                {openGroupTeamId && (
                                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                                        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setOpenGroupTeamId(null)} />
                                        <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 animate-in zoom-in-95 duration-200">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-xl font-black text-gray-800 tracking-tight">Tilknyt Teams</h3>
                                                <button onClick={() => setOpenGroupTeamId(null)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
                                            </div>
                                            <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                                                {state.teams.map(team => {
                                                    const group = state.aarshjulGrupper.find(g => g.id === openGroupTeamId);
                                                    const isMember = group?.teams.includes(team.id);
                                                    return (
                                                        <button
                                                            key={team.id}
                                                            onClick={() => group && toggleGroupTeam(group, team.id)}
                                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${isMember ? '' : 'hover:bg-gray-50 text-gray-600'}`}
                                                            style={isMember ? { backgroundColor: `${team.color || '#3b82f6'}15`, color: team.color || '#3b82f6' } : {}}
                                                        >
                                                            <span>{team.navn}</span>
                                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${isMember ? 'text-white border-transparent' : 'border-gray-200'}`} style={isMember ? { backgroundColor: team.color || '#3b82f6' } : {}}>
                                                                {isMember && <Check size={12} strokeWidth={4} />}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>

                {/* Confirmation Modals */}
                <ConfirmModal
                    isOpen={!!userToDelete}
                    onClose={() => setUserToDelete(null)}
                    onConfirm={confirmDelete}
                    title={userToDelete?.is_active ? 'Deaktiver bruger' : 'Slet bruger permanent'}
                    message={userToDelete?.is_active
                        ? `Er du sikker på at du vil deaktivere ${userToDelete.username}?`
                        : `Er du sikker på at du vil slette ${userToDelete?.username} permanent? Denne handling kan ikke fortrydes.`
                    }
                    confirmText={userToDelete?.is_active ? 'Deaktiver' : 'Slet permanent'}
                    isDestructive={true}
                />

                <ConfirmModal
                    isOpen={!!userToToggleStatus}
                    onClose={() => setUserToToggleStatus(null)}
                    onConfirm={confirmToggleActive}
                    title={userToToggleStatus?.is_active ? 'Deaktiver bruger' : 'Aktivere bruger'}
                    message={`Er du sikker på at du vil ${userToToggleStatus?.is_active ? 'deaktivere' : 'aktivere'} ${userToToggleStatus?.username}?`}
                    confirmText={userToToggleStatus?.is_active ? 'Deaktiver' : 'Aktiver'}
                    isDestructive={userToToggleStatus?.is_active}
                />

                <ConfirmModal
                    isOpen={!!teamToDelete}
                    onClose={() => setTeamToDelete(null)}
                    onConfirm={confirmTeamDelete}
                    title="Slet team"
                    message={`Er du sikker på at du vil slette teamet "${teamToDelete?.navn}"?`}
                    confirmText="Slet team"
                    isDestructive={true}
                />

                <ConfirmModal
                    isOpen={!!groupToDelete}
                    onClose={() => setGroupToDelete(null)}
                    onConfirm={confirmGroupDelete}
                    title="Slet gruppe"
                    message={`Er du sikker på at du vil slette gruppen "${groupToDelete?.navn}"?`}
                    confirmText="Slet gruppe"
                    isDestructive={true}
                />

                <ConfirmModal
                    isOpen={!!membershipToRemove}
                    onClose={() => setMembershipToRemove(null)}
                    onConfirm={confirmRemoveMember}
                    title="Fjern fra team"
                    message={`Er du sikker på at du vil fjerne brugeren fra ${membershipToRemove?.team.navn}?`}
                    confirmText="Fjern medlem"
                    isDestructive={true}
                />

                {/* Toast Notifications */}
                <Toast
                    message={toast.message}
                    type={toast.type}
                    isVisible={toast.isVisible}
                    onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
                />
            </div>
        </div>
    );
};

export default UsersPage;
