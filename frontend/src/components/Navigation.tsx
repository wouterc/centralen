import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, LibraryBig, Clock, Calendar, Pin, Briefcase } from 'lucide-react';
import { useAppState } from '../StateContext';
import GlobalSearch from './GlobalSearch';

const Navigation: React.FC = () => {
    const { state, logout } = useAppState();
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
                    <span className="font-black text-gray-800 tracking-tight hidden sm:block">CENTRALEN</span>
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
                        Tavlen
                    </NavLink>
                    <NavLink
                        to="/vidensbank"
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 h-full text-sm font-bold transition-all border-b-2
                            ${isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-200'}
                        `}
                    >
                        <LibraryBig size={18} />
                        Vidensbank
                    </NavLink>
                    <NavLink
                        to="/tidsregistrering"
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 h-full text-sm font-bold transition-all border-b-2
                            ${isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-200'}
                        `}
                    >
                        <Clock size={18} />
                        Tidsregistrering
                    </NavLink>
                    <NavLink
                        to="/aarshjul"
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 h-full text-sm font-bold transition-all border-b-2
                            ${isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-200'}
                        `}
                    >
                        <Calendar size={18} />
                        Årshjul
                    </NavLink>
                    <NavLink
                        to="/prikbord"
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 h-full text-sm font-bold transition-all border-b-2
                            ${isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-200'}
                        `}
                    >
                        <Pin size={18} />
                        Prikbord
                    </NavLink>
                    <NavLink
                        to="/apps"
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 h-full text-sm font-bold transition-all border-b-2
                            ${isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-200'}
                        `}
                    >
                        <Briefcase size={18} />
                        Apps
                    </NavLink>
                    <NavLink
                        to="/users"
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 h-full text-sm font-bold transition-all border-b-2
                            ${isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-200'}
                        `}
                    >
                        <Users size={18} />
                        Brugere & Teams
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
                                                {state.currentUser.role === 'ADMIN' ? 'Administrator' :
                                                    state.currentUser.role === 'SUPERUSER' ? 'Superbruger' : 'Medlem'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2">
                                    <button
                                        onClick={() => {
                                            setShowUserDropdown(false);
                                            logout();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <LogOut size={18} />
                                        Log ud
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
