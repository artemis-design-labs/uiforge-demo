'use client';
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginStart, loginSuccess, loginFailure } from '@/store/authSlice';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useAppDispatch();
    const { isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

    // Redirect if already authenticated
    if (isAuthenticated) {
        window.location.href = '/design';
        return <div className="min-h-screen flex items-center justify-center">Redirecting to dashboard...</div>;
    }

    const handleDemoLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(loginStart());

        // Simulate login delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Demo credentials check
        if (password === 'demo123' || password === 'demo') {
            const demoUser = {
                id: 'demo-user-1',
                email: email || 'demo@uiforge.ai',
                name: 'Demo User',
                handle: 'demo_user',
                img_url: '',
            };
            
            // Store in localStorage for persistence
            localStorage.setItem('figma_user', JSON.stringify(demoUser));
            localStorage.setItem('figma_token', 'demo-token-xyz');
            
            // Dispatch to Redux
            dispatch(loginSuccess(demoUser));
            
            // Redirect
            window.location.href = '/design';
        } else {
            dispatch(loginFailure('Use password: demo123'));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        UI Forge
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Convert your Figma designs to React components
                    </p>
                </div>
                
                <form onSubmit={handleDemoLogin} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="demo@uiforge.ai"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="demo123"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-center text-sm text-red-600">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                    
                    <p className="text-center text-xs text-gray-500">
                        Demo: Use any email with password <strong>demo123</strong>
                    </p>
                </form>
            </div>
        </div>
    );
}
