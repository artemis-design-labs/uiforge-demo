import axios from '@/lib/axios';

// Use Railway backend if configured, otherwise fall back to same-origin
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const authService = {
    // Check if user is authenticated
    checkAuth: async () => {
        // Check for demo user first
        const demoUser = localStorage.getItem('figma_user');
        const demoToken = localStorage.getItem('figma_token');

        if (demoToken === 'demo-token-xyz' && demoUser) {
            return { user: JSON.parse(demoUser) };
        }

        // Otherwise check with backend
        const response = await axios.get('auth/me');
        return response.data;
    },

    // Initiate Figma login
    loginWithFigma: () => {
        window.location.href = `${API_BASE_URL}/api/v1/auth/figma/login`;
    },

    // Logout
    logout: async () => {
        // Clear demo tokens
        localStorage.removeItem('figma_user');
        localStorage.removeItem('figma_token');
        
        try {
            await axios.post('/auth/logout');
        } catch (e) {
            // Ignore if backend not available
        }
    },
};
