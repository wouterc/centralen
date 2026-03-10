import { api } from '../api';

export interface Gruppe {
    id: number;
    navn: string;
    raekkefoelge: number;
    teams: number[];
    teams_detail?: any[];
    oprettet: string;
}

export interface Aktivitet {
    id: number;
    navn: string;
    beskrivelse: string;
    start_dato: string;
    slut_dato: string;
    farve: string;
    gruppe?: number | null;
    oprettet: string;
    opdateret: string;
}

const API_BASE = `/aarshjul/aktiviteter/`;
const GRUPPE_BASE = `/aarshjul/grupper/`;

export const aarshjulService = {
    // Aktiviteter
    getAll: async (teamId?: number): Promise<Aktivitet[]> => {
        const url = teamId ? `${API_BASE}?team_id=${teamId}` : API_BASE;
        return api.get<Aktivitet[]>(url);
    },
    get: async (id: number): Promise<Aktivitet> => {
        return api.get<Aktivitet>(`${API_BASE}${id}/`);
    },
    create: async (data: Partial<Aktivitet>): Promise<Aktivitet> => {
        return api.post<Aktivitet>(API_BASE, data);
    },
    update: async (id: number, data: Partial<Aktivitet>): Promise<Aktivitet> => {
        return api.put<Aktivitet>(`${API_BASE}${id}/`, data);
    },
    delete: async (id: number): Promise<void> => {
        return api.delete(`${API_BASE}${id}/`);
    },

    // Grupper
    getAllGrupper: async (teamId?: number): Promise<Gruppe[]> => {
        const url = teamId ? `${GRUPPE_BASE}?team_id=${teamId}` : GRUPPE_BASE;
        return api.get<Gruppe[]>(url);
    },
    getGruppe: async (id: number): Promise<Gruppe> => {
        return api.get<Gruppe>(`${GRUPPE_BASE}${id}/`);
    },
    createGruppe: async (data: Partial<Gruppe>): Promise<Gruppe> => {
        return api.post<Gruppe>(GRUPPE_BASE, data);
    },
    updateGruppe: async (id: number, data: Partial<Gruppe>): Promise<Gruppe> => {
        return api.put<Gruppe>(`${GRUPPE_BASE}${id}/`, data);
    },
    deleteGruppe: async (id: number): Promise<void> => {
        return api.delete(`${GRUPPE_BASE}${id}/`);
    }
};
