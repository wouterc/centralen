import { api } from '../api';
import type { Opgave, OpgaveKommentar } from '../types';

export const opgaveService = {
    getAll: async (params?: Record<string, any>) => {
        return await api.get<Opgave[]>('/opgaver/', { params });
    },

    get: async (id: number) => {
        return await api.get<Opgave>(`/opgaver/${id}/`);
    },

    create: async (data: Partial<Opgave>) => {
        return await api.post<Opgave>('/opgaver/', data);
    },

    update: async (id: number, data: Partial<Opgave>) => {
        return await api.patch<Opgave>(`/opgaver/${id}/`, data);
    },

    delete: async (id: number) => {
        return await api.delete(`/opgaver/${id}/`);
    },

    updateStatus: async (id: number, status: string, index?: number) => {
        return await api.post<Opgave>(`/opgaver/${id}/update_status/`, { status, index });
    },

    addComment: async (opgaveId: number, tekst: string) => {
        return await api.post<OpgaveKommentar>('/opgave-kommentarer/', { opgave: opgaveId, tekst });
    },

    updateComment: async (commentId: number, tekst: string) => {
        return await api.patch<OpgaveKommentar>(`/opgave-kommentarer/${commentId}/`, { tekst });
    },

    deleteComment: async (commentId: number) => {
        return await api.delete(`/opgave-kommentarer/${commentId}/`);
    },

    getStatusHistory: async (id: number) => {
        return await api.get<any[]>(`/opgaver/${id}/status_historik/`);
    },
    archive: async (id: number) => {
        return await api.post(`/opgaver/${id}/archive/`, {});
    },
    restore: async (id: number) => {
        return await api.post(`/opgaver/${id}/restore/`, {});
    },
    getArchived: async () => {
        return await api.get<Opgave[]>(`/opgaver/arkiverede/`);
    }
};
