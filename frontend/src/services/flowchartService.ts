import { api } from '../api';
import type { Flowchart, FlowchartNode, FlowchartEdge } from '../types';

interface BulkSavePayload {
    nodes: {
        node_id: string;
        navn: string;
        beskrivelse: string;
        farve: string;
        form_type: string;
        x_pos: number;
        y_pos: number;
        bredde: number;
        hoejde: number;
    }[];
    edges: {
        edge_id: string;
        source_node_id: string;
        target_node_id: string;
        label: string;
    }[];
}

export const flowchartService = {
    getAll: async () => {
        return api.get<Flowchart[]>('/flowchart/flowcharts/');
    },
    get: async (id: number) => {
        return api.get<Flowchart>(`/flowchart/flowcharts/${id}/`);
    },
    create: async (data: { navn: string; beskrivelse?: string; team?: number | null }) => {
        return api.post<Flowchart>('/flowchart/flowcharts/', data);
    },
    update: async (id: number, data: Partial<Pick<Flowchart, 'navn' | 'beskrivelse' | 'team'>>) => {
        return api.patch<Flowchart>(`/flowchart/flowcharts/${id}/`, data);
    },
    delete: async (id: number) => {
        return api.delete(`/flowchart/flowcharts/${id}/`);
    },
    bulkSave: async (id: number, payload: BulkSavePayload) => {
        return api.patch<Flowchart>(`/flowchart/flowcharts/${id}/save/`, payload);
    },

    // Individual node/edge ops (used when adding single items without full save)
    createNode: async (data: Omit<FlowchartNode, 'id'> & { flowchart: number }) => {
        return api.post<FlowchartNode>('/flowchart/flowchart-nodes/', data);
    },
    updateNode: async (id: number, data: Partial<FlowchartNode>) => {
        return api.patch<FlowchartNode>(`/flowchart/flowchart-nodes/${id}/`, data);
    },
    deleteNode: async (id: number) => {
        return api.delete(`/flowchart/flowchart-nodes/${id}/`);
    },
    createEdge: async (data: Omit<FlowchartEdge, 'id' | 'source_node_id' | 'target_node_id'> & { flowchart: number }) => {
        return api.post<FlowchartEdge>('/flowchart/flowchart-edges/', data);
    },
    deleteEdge: async (id: number) => {
        return api.delete(`/flowchart/flowchart-edges/${id}/`);
    },
};
