import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, LibraryBig, Clock, Calendar, Pin, Briefcase, Building2, ChevronRight, Check, Settings, GitBranch } from 'lucide-react';
import { useAppState } from '../StateContext';
import GlobalSearch from './GlobalSearch';
import { useTranslation } from '../services/translationService';

const Navigation: React.FC = () => {
    const { state, logout, setActiveWorkspaceId } = useAppState();
    const { t } = useTranslation();
    const location = useLocation();

    const [showUserDropdown, setShowUserDropdown] = React.useState(false);
    const userDropdownRef = React.useRef<HTMLDivElement>(null);

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
                        to="/vidensbank"
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 h-full text-sm font-bold transition-all border-b-2
                            ${isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-200'}
                        `}
                    >
                        <LibraryBig size={18} />
                        {t('nav.knowledge', 'Knowledge Base')}
                    </NavLink>
                    <NavLink
                        to="/tidsregistrering"
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 h-full text-sm font-bold transition-all border-b-2
                            ${isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-200'}
                        `}
                    >
                        <Clock size={18} />
                        {t('nav.time', 'Time Tracking')}
                    </NavLink>
                    <NavLink
                        to="/aarshjul"
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 h-full text-sm font-bold transition-all border-b-2
                            ${isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-200'}
                        `}
                    >
                        <Calendar size={18} />
                        {t('nav.calendar', 'Annual Calendar')}
                    </NavLink>
                    <NavLink
                        to="/prikbord"
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 h-full text-sm font-bold transition-all border-b-2
                            ${isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-200'}
                        `}
                    >
                        <Pin size={18} />
                        {t('nav.pinboard', 'Pinboard')}
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
                    <NavLink
                        to="/apps"
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 h-full text-sm font-bold transition-all border-b-2
                            ${isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-200'}
                        `}
                    >
                        <Briefcase size={18} />
                        {t('nav.apps', 'Apps')}
                    </NavLink>
                    <NavLink
                        to="/users"
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 h-full text-sm font-bold transition-all border-b-2
                            ${isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-200'}
                        `}
                    >
                        <Users size={18} />
                        {t('nav.users', 'Users & Teams')}
                    </NavLink>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <GlobalSearch />

                {state.currentUser && (
                    <div className="relative ml-2" ref={userDropdownRef}>
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
                                <div className="p-2 border-b border-gray-50 max-h-48 overflow-y-auto">
                                    <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
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
                                                w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl transition-all mb-1
                                                ${state.activeWorkspaceId === mem.company.id
                                                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                    : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50'}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-2 h-2 rounded-full shadow-sm"
                                                    style={{ backgroundColor: mem.color }}
                                                ></div>
                                                <span className="truncate max-w-[120px]">{mem.company.navn}</span>
                                            </div>
                                            {state.activeWorkspaceId === mem.company.id && <Check size={14} className="text-blue-600" />}
                                            {state.activeWorkspaceId !== mem.company.id && <ChevronRight size={14} className="opacity-0 group-hover:opacity-100" />}
                                        </button>
                                    ))}
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
        </nav >
    );
};

export default Navigation;
