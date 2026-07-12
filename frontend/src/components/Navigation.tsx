import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, LibraryBig, Clock, Calendar, Pin, Briefcase, Building2, ChevronRight, Check, Settings, GitBranch, Plus, Loader2 } from 'lucide-react';
import { useAppState } from '../StateContext';
import GlobalSearch from './GlobalSearch';
import { useTranslation } from '../services/translationService';
import { api } from '../api';

interface Invitation {
    id: number;
    company_name: string;
    role: string;
    invited_by: string;
    token: string;
}

const Navigation: React.FC = () => {
    const { state, logout, setActiveWorkspaceId, setState, refreshCurrentUser } = useAppState();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const location = useLocation();

    const [showUserDropdown, setShowUserDropdown] = React.useState(false);
    const userDropdownRef = React.useRef<HTMLDivElement>(null);
    const [isCreatingWorkspace, setIsCreatingWorkspace] = React.useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = React.useState('');
    const [workspaceSubmitting, setWorkspaceSubmitting] = React.useState(false);
    const [invitations, setInvitations] = React.useState<Invitation[]>([]);

    React.useEffect(() => {
        if (state.currentUser) {
            api.get<Invitation[]>('/my-invitations/')
                .then(res => setInvitations(res))
                .catch(err => console.error("Error fetching invitations inside navigation:", err));
        }
    }, [state.currentUser]);

    const handleAcceptInvitation = async (invId: number) => {
        try {
            await api.post(`/my-invitations/${invId}/accept/`);
            if (refreshCurrentUser) {
                await refreshCurrentUser();
            } else {
                const finalUser = await api.get<any>('/users/me/');
                setState(prev => ({ ...prev, currentUser: finalUser }));
            }
            // Refresh local invitations list
            const updatedInvs = await api.get<Invitation[]>('/my-invitations/');
            setInvitations(updatedInvs);
        } catch (err) {
            console.error("Error accepting invitation inside navigation dropdown:", err);
        }
    };

    const handleCreateWorkspace = async () => {
        if (!newWorkspaceName.trim()) return;
        setWorkspaceSubmitting(true);

        try {
            // Post to backend to create company
            const newCompany = await api.post<{ id: string; navn: string }>('/companies/', {
                navn: newWorkspaceName.trim()
            });

            // Set active workspace in local storage
            localStorage.setItem('activeWorkspaceId', newCompany.id);

            // Fetch refreshed data
            const updatedUser = await api.get<any>('/users/me/');
            const users = await api.get<any[]>('/users/');
            const teams = await api.get<any[]>('/teams/');

            setState(prev => ({
                ...prev,
                currentUser: updatedUser,
                activeWorkspaceId: newCompany.id,
                users,
                teams
            }));

            setIsCreatingWorkspace(false);
            setNewWorkspaceName('');
            navigate('/board');
        } catch (err) {
            console.error("Fejl ved oprettelse af arbejdsrum:", err);
            alert(t('workspace.create.error', 'Kunne ikke oprette arbejdsrummet. Prøv igen.'));
        } finally {
            setWorkspaceSubmitting(false);
        }
    };

    React.useEffect(() => {
        if (location.pathname && location.pathname !== '/login') {
            localStorage.setItem('lastVisitedPage', location.pathname);
        }
    }, [location.pathname]);

    // Close user dropdown on click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                setShowUserDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="bg-white border-b px-6 py-0 h-14 flex items-center justify-between shadow-sm z-30">
            <div className="flex items-center gap-8 h-full">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-sm">C</div>
                    <div className="flex flex-col">
                        <span className="font-black text-gray-800 tracking-tight leading-none">CENTRALEN</span>
                        {state.currentUser?.memberships?.find(m => m.company.id === state.activeWorkspaceId) && (
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-0.5">
                                {state.currentUser.memberships.find(m => m.company.id === state.activeWorkspaceId)?.company.navn}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex gap-1 h-full">
                    <NavLink
                        to="/board"
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 h-full text-sm font-bold transition-all border-b-2
                            ${isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-200'}
                        `}
                    >
                        <LayoutDashboard size={18} />
                        {t('nav.board', 'Board')}
                    </NavLink>
                    <NavLink
                        to="/users"
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 h-full text-sm font-bold transition-all border-b-2
                            ${isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-200'}
                        `}
                    >
                        <Users size={18} />
                        {t('nav.users', 'Medlemmer')}
                    </NavLink>
                    <NavLink
                        to="/vidensbank"
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 h-full text-sm font-bold transition-all border-b-2
                            ${isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-200'}
                        `}
                    >
                        <LibraryBig size={18} />
                        {t('nav.knowledge', 'Vidensbank')}
                    </NavLink>
                    <NavLink
                        to="/tidsregistrering"
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 h-full text-sm font-bold transition-all border-b-2
                            ${isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-200'}
                        `}
                    >
                        <Clock size={18} />
                        {t('nav.time', 'Tidsregistrering')}
                    </NavLink>
                    <NavLink
                        to="/aarshjul"
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 h-full text-sm font-bold transition-all border-b-2
                            ${isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-200'}
                        `}
                    >
                        <Calendar size={18} />
                        {t('nav.calendar', 'Årshjul')}
                    </NavLink>
                    <NavLink
                        to="/prikbord"
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 h-full text-sm font-bold transition-all border-b-2
                            ${isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-200'}
                        `}
                    >
                        <Pin size={18} />
                        {t('nav.pinboard', 'Prikbord')}
                    </NavLink>
                    <NavLink
                        to="/apps"
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 h-full text-sm font-bold transition-all border-b-2
                            ${isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-200'}
                        `}
                    >
                        <Briefcase size={18} />
                        {t('nav.apps', 'Værktøjer')}
                    </NavLink>
                    <NavLink
                        to="/flowchart"
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 h-full text-sm font-bold transition-all border-b-2
                            ${isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-200'}
                        `}
                    >
                        <GitBranch size={18} />
                        {t('nav.flowchart', 'Flowchart')}
                    </NavLink>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <GlobalSearch />

                {state.currentUser && (
                    <div className="relative ml-2" ref={userDropdownRef}>
                        <div className="relative">
                            <button
                                onClick={() => setShowUserDropdown(!showUserDropdown)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white shadow-md transition-all border-2 ${showUserDropdown ? 'border-indigo-500 scale-110' : 'border-white hover:border-red-400 hover:scale-105'
                                    }`}
                                style={{ backgroundColor: state.currentUser.color || '#dc2626' }}
                            >
                                {state.currentUser.first_name || state.currentUser.last_name ?
                                    `${state.currentUser.first_name?.[0] || ''}${state.currentUser.last_name?.[0] || ''}` :
                                    state.currentUser.username.substring(0, 2).toUpperCase()
                                }
                            </button>
                            {invitations.length > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white"></span>
                                </span>
                            )}
                        </div>

                        {showUserDropdown && (
                            <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white shadow-inner" style={{ backgroundColor: state.currentUser.color || '#dc2626' }}>
                                            {state.currentUser.first_name || state.currentUser.last_name ?
                                                `${state.currentUser.first_name?.[0] || ''}${state.currentUser.last_name?.[0] || ''}` :
                                                state.currentUser.username.substring(0, 2).toUpperCase()
                                            }
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-black text-gray-800 truncate leading-none mb-1">
                                                {state.currentUser.username}
                                            </div>
                                            <div className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest inline-block">
                                                {state.currentUser.role === 'ADMIN' ? t('role.admin', 'Administrator') :
                                                    state.currentUser.role === 'SUPERUSER' ? t('role.superuser', 'Superuser') : t('role.member', 'Member')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2 border-b border-gray-50 max-h-56 overflow-y-auto">
                                    <div className="px-4 py-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Building2 size={12} />
                                        {t('settings.tab.workspace', 'Arbejdsrum')}
                                    </div>
                                    {state.currentUser.memberships?.map(mem => (
                                        <button
                                            key={mem.id}
                                            onClick={() => {
                                                setActiveWorkspaceId(mem.company.id);
                                                setShowUserDropdown(false);
                                            }}
                                            className={`
                                                w-full flex items-center justify-between px-4 py-2 text-xs font-bold rounded-xl transition-all mb-0.5
                                                ${state.activeWorkspaceId === mem.company.id
                                                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                    : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50'}
                                            `}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2 h-2 rounded-full shadow-sm"
                                                    style={{ backgroundColor: mem.color }}
                                                ></div>
                                                <span className="truncate max-w-[120px]">{mem.company.navn}</span>
                                            </div>
                                            {state.activeWorkspaceId === mem.company.id && <Check size={12} className="text-blue-600" />}
                                            {state.activeWorkspaceId !== mem.company.id && <ChevronRight size={12} className="opacity-0 group-hover:opacity-100" />}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => {
                                            setShowUserDropdown(false);
                                            setIsCreatingWorkspace(true);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all mt-1 border-t border-dashed border-gray-100 pt-2"
                                    >
                                        <Plus size={14} />
                                        {t('navigation.workspace.create_new', 'Opret nyt arbejdsrum')}
                                    </button>

                                    {/* Pending invitations list inside dropdown */}
                                    {invitations.length > 0 && (
                                        <div className="mt-3 pt-2.5 border-t border-dashed border-gray-100">
                                            <div className="px-4 py-1 text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                </span>
                                                {t('navigation.invitations.title', 'Mangler godkendelse')}
                                            </div>
                                            {invitations.map(inv => (
                                                <div
                                                    key={inv.id}
                                                    className="flex items-center justify-between px-4 py-1.5 text-xs font-bold text-gray-500"
                                                >
                                                    <span className="truncate text-gray-700 max-w-[110px]">{inv.company_name}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAcceptInvitation(inv.id);
                                                        }}
                                                        className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-black uppercase transition-colors cursor-pointer"
                                                    >
                                                        {t('login.invitations.accept', 'Accepter')}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-2">
                                    <NavLink
                                        to="/settings"
                                        onClick={() => setShowUserDropdown(false)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all mb-1"
                                    >
                                        <Settings size={18} />
                                        {t('nav.settings', 'Indstillinger')}
                                    </NavLink>
                                    <button
                                        onClick={() => {
                                            setShowUserDropdown(false);
                                            logout();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <LogOut size={18} />
                                        {t('nav.logout', 'Log Out')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {isCreatingWorkspace && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsCreatingWorkspace(false)}>
                    <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-black text-gray-800 mb-2">{t('workspace.create.title', 'Opret nyt arbejdsrum')}</h3>
                        <p className="text-xs text-gray-500 mb-4">{t('workspace.create.subtitle', 'Indtast navnet på din nye virksomhed eller gruppe.')}</p>
                        
                        <input
                            type="text"
                            value={newWorkspaceName}
                            onChange={e => setNewWorkspaceName(e.target.value)}
                            placeholder={t('workspace.create.placeholder', 'F.eks. Min Virksomhed')}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all mb-4 font-medium"
                            autoFocus
                        />
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsCreatingWorkspace(false)}
                                className="flex-1 py-3 text-xs font-bold text-gray-500 hover:bg-gray-50 border border-gray-100 rounded-2xl transition-colors"
                            >
                                {t('common.cancel', 'Annuller')}
                            </button>
                            <button
                                onClick={handleCreateWorkspace}
                                disabled={!newWorkspaceName.trim() || workspaceSubmitting}
                                className="flex-1 py-3 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                            >
                                {workspaceSubmitting ? <Loader2 size={14} className="animate-spin" /> : t('workspace.create.submit', 'Opret arbejdsrum')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav >
    );
};

export default Navigation;
