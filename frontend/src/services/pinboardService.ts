import { api } from '../api';
import type { PinboardPost, PostEvaluationType } from '../types';

export const pinboardService = {
    getAll: (params?: Record<string, any>) => api.get<PinboardPost[]>('/prikbord-posts/', { params }),
    get: (id: number) => api.get<PinboardPost>(`/prikbord-posts/${id}/`),
    create: (data: Partial<PinboardPost>) => api.post<PinboardPost>('/prikbord-posts/', data),
    update: (id: number, data: Partial<PinboardPost>) => api.patch<PinboardPost>(`/prikbord-posts/${id}/`, data),
    delete: (id: number) => api.delete(`/prikbord-posts/${id}/`),
    evaluate: (id: number, evaluering: PostEvaluationType) =>
        api.post<PinboardPost>(`/prikbord-posts/${id}/evaluate/`, { evaluering }),
    addComment: (id: number, tekst: string) =>
        api.post<PinboardPost>(`/prikbord-posts/${id}/add_comment/`, { tekst }),
    archive: (id: number) => api.post<PinboardPost>(`/prikbord-posts/${id}/archive/`),
    unarchive: (id: number) => api.post<PinboardPost>(`/prikbord-posts/${id}/unarchive/`)
};
