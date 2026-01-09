import axios from '@/lib/axios';

export const authService = {
    // Check if user is authenticated
    checkAuth: async () => {
        const response = await axios.get('auth/me');
        return response.data;
    },

    // Initiate Figma login
    loginWithFigma: () => {
        window.location.href = 'http://localhost:8080/api/v1/auth/figma/login';
    },

    // Logout
    logout: async () => {
        await axios.post('/auth/logout');
    },
};