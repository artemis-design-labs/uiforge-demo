import axios from '@/lib/axios';

// Use Railway backend for OAuth initiation
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const authService = {
    // Check if user is authenticated
    checkAuth: async () => {
        // Check for demo user first
        const demoUser = localStorage.getItem('figma_user');
        const demoToken = localStorage.getItem('figma_token');

        if (demoToken === 'demo-token-xyz' && demoUser) {
            return { user: JSON.parse(demoUser) };
        }

        // Use Vercel's local API route (which has access to the cookie)
        const response = await fetch('/api/auth/me', {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Not authenticated');
        }

        return response.json();
    },

    // Initiate Figma login - goes to Railway for OAuth
    loginWithFigma: () => {
        window.location.href = `${BACKEND_URL}/api/v1/auth/figma/login`;
    },

    // Logout
    logout: async () => {
        // Clear demo tokens
        localStorage.removeItem('figma_user');
        localStorage.removeItem('figma_token');

        try {
            // Use Vercel's local API route to clear the cookie
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
        } catch (e) {
            // Ignore if backend not available
        }
    },
};
