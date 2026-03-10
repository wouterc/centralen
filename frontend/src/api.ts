import { API_BASE_URL } from './config';
import { getCookie } from './utils';

interface RequestOptions extends RequestInit {
    body?: any;
    params?: Record<string, any>;
    rawResponse?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', headers = {}, body, params, ...rest } = options;

    const config: RequestInit = {
        method,
        credentials: 'include',
        headers: {
            ...headers,
        },
        ...rest,
    };

    if (body && !(body instanceof FormData)) {
        (config.headers as any)['Content-Type'] = 'application/json';
        config.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
        config.body = body;
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
        const csrfToken = getCookie('csrftoken');
        if (csrfToken) {
            (config.headers as any)['X-CSRFToken'] = csrfToken;
        }
    }

    let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    if (params) {
        // Use window.location.origin as base to handle relative URLs on production
        const urlObj = new URL(url, window.location.origin);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                urlObj.searchParams.append(key, value.toString());
            }
        });
        url = urlObj.toString();
    }

    const response = await fetch(url, config);

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { detail: response.statusText };
        }
        const error = new Error(errorData.detail || errorData.error || JSON.stringify(errorData) || 'API kald fejlede');
        (error as any).status = response.status;
        throw error;
    }

    if (options.rawResponse) return response as any;
    if (response.status === 204) return {} as T;

    return response.json();
}

export const api = {
    get: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: 'GET' }),
    post: <T>(endpoint: string, body?: any, options?: RequestOptions) => request<T>(endpoint, { ...options, method: 'POST', body }),
    put: <T>(endpoint: string, body?: any, options?: RequestOptions) => request<T>(endpoint, { ...options, method: 'PUT', body }),
    patch: <T>(endpoint: string, body?: any, options?: RequestOptions) => request<T>(endpoint, { ...options, method: 'PATCH', body }),
    delete: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: 'DELETE' }),
};
