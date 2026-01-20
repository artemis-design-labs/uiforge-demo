import axios from 'axios';

// Use Railway backend if configured, otherwise fall back to same-origin
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
    : '/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Only redirect to login if not already on login page to prevent infinite loops
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        
        // Handle document size errors (413 Payload Too Large or custom error)
        if (error.response?.status === 413 || 
            error.response?.data?.code === 'DOCUMENT_TOO_LARGE' ||
            error.response?.data?.message?.includes('document size')) {
            error.isDocumentSizeError = true;
            error.friendlyMessage = 'This Figma file is too large to process. Please try a smaller file or contact support for assistance.';
        }
        
        return Promise.reject(error);
    }
);

export default api;