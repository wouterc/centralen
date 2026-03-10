import { api } from '../api';
import type { AppLink, AppPurpose } from '../types';

export const appLinkService = {
    getAll: async () => {
        return api.get<AppLink[]>('/applinks/links/');
    },
    get: async (id: number) => {
        return api.get<AppLink>(`/applinks/links/${id}/`);
    },
    create: async (data: Omit<AppLink, 'id' | 'created_at' | 'updated_at'>) => {
        return api.post<AppLink>('/applinks/links/', data);
    },
    update: async (id: number, data: Partial<AppLink>) => {
        return api.put<AppLink>(`/applinks/links/${id}/`, data);
    },
    delete: async (id: number) => {
        return api.delete(`/applinks/links/${id}/`);
    },
    open: async (id: number) => {
        return api.post<{ status: string; message: string }>(`/applinks/links/${id}/open/`);
    },
    openFolder: async (id: number) => {
        return api.post<{ status: string; message: string }>(`/applinks/links/${id}/open_folder/`);
    },

    // Purposes
    getPurposes: async () => {
        return api.get<AppPurpose[]>('/applinks/purposes/');
    },
    createPurpose: async (name: string) => {
        return api.post<AppPurpose>('/applinks/purposes/', { name });
    }
};
