import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Team, AarshjulGruppe, PinboardPost } from './types';
import { api } from './api';

interface AppState {
    currentUser: User | null;
    users: User[];
    teams: Team[];
    aarshjulGrupper: AarshjulGruppe[];
    currentTeamId: number | null;
    pinboardPosts: PinboardPost[];
}

interface StateContextType {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
    refreshUsers: () => Promise<void>;
    refreshTeams: () => Promise<void>;
    refreshGrupper: () => Promise<void>;
    setCurrentTeamId: (id: number | null) => void;
    logout: () => Promise<void>;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>({
        currentUser: null,
        users: [],
        teams: [],
        aarshjulGrupper: [],
        currentTeamId: localStorage.getItem('currentTeamId') ? Number(localStorage.getItem('currentTeamId')) : null,
        pinboardPosts: [],
    });

    const refreshUsers = async () => {
        try {
            const users = await api.get<User[]>('/users/');
            setState(prev => ({ ...prev, users }));
        } catch (e) {
            console.error("Kunne ikke hente brugere", e);
        }
    };

    const refreshTeams = async () => {
        try {
            const teams = await api.get<Team[]>('/teams/');
            setState(prev => ({ ...prev, teams }));
        } catch (e) {
            console.error("Kunne ikke hente teams", e);
        }
    };

    const refreshGrupper = async () => {
        try {
            const aarshjulGrupper = await api.get<AarshjulGruppe[]>('/aarshjul/grupper/');
            setState(prev => ({ ...prev, aarshjulGrupper }));
        } catch (e) {
            console.error("Kunne ikke hente grupper", e);
        }
    };

    const setCurrentTeamId = (id: number | null) => {
        if (id !== null) localStorage.setItem('currentTeamId', id.toString());
        else localStorage.removeItem('currentTeamId');
        setState(prev => ({ ...prev, currentTeamId: id }));
    };

    useEffect(() => {
        const init = async () => {
            try {
                // First attempt to get the current user
                const currentUser = await api.get<User>('/users/me/');

                // Then try to fetch users, teams and grupper
                let users: User[] = [];
                let teams: Team[] = [];
                let aarshjulGrupper: AarshjulGruppe[] = [];

                try {
                    const [usersData, teamsData, grupperData] = await Promise.all([
                        api.get<User[]>('/users/'),
                        api.get<Team[]>('/teams/'),
                        api.get<AarshjulGruppe[]>('/aarshjul/grupper/')
                    ]);
                    users = usersData;
                    teams = teamsData;
                    aarshjulGrupper = grupperData;
                } catch (e) {
                    console.error("Kunne ikke hente supplerende data", e);
                }

                let currentTeamId = state.currentTeamId;
                // If no team is selected, default to "Alle teams" (0)
                if (currentTeamId === null) {
                    currentTeamId = 0;
                    localStorage.setItem('currentTeamId', '0');
                }

                setState(prev => ({ ...prev, currentUser, users, teams, aarshjulGrupper, currentTeamId }));
            } catch (e) {
                console.error("Bruger er ikke logget ind eller API er nede", e);
            }
        };
        init();
    }, []);

    const logout = async () => {
        try {
            await api.post('/logout/');
        } catch (e) {
            console.error("Logout fejl", e);
        } finally {
            setState({
                currentUser: null,
                users: [],
                teams: [],
                aarshjulGrupper: [],
                currentTeamId: null,
                pinboardPosts: [],
            });
            localStorage.removeItem('currentTeamId');
        }
    };

    return (
        <StateContext.Provider value={{ state, setState, refreshUsers, refreshTeams, refreshGrupper, setCurrentTeamId, logout }}>
            {children}
        </StateContext.Provider>
    );
};

export const useAppState = () => {
    const context = useContext(StateContext);
    if (!context) throw new Error('useAppState must be used within a StateProvider');
    return context;
};
