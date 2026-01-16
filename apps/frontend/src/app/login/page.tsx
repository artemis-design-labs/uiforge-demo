'use client';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';

export default function LoginPage() {
    const searchParams = useSearchParams();
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const error = searchParams.get('error');

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            window.location.href = '/design';
        }
    }, [isAuthenticated]);

    if (isAuthenticated) {
        return <div className="min-h-screen flex items-center justify-center">Redirecting to dashboard...</div>;
    }

    const handleFigmaLogin = () => {
        // Redirect to backend OAuth endpoint
        window.location.href = '/api/v1/auth/figma/login';
    };

    const getErrorMessage = (errorCode: string | null) => {
        switch (errorCode) {
            case 'invalid_state':
                return 'Authentication session expired. Please try again.';
            case 'pkce_missing':
                return 'Authentication error. Please try again.';
            case 'invalid_grant':
                return 'Authorization failed. Please try again.';
            case 'auth_failed':
                return 'Authentication failed. Please try again.';
            default:
                return null;
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

                <div className="mt-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <p className="text-center text-sm text-red-600">
                                {getErrorMessage(error)}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={handleFigmaLogin}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 38 57" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
                            <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
                            <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
                            <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
                            <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
                        </svg>
                        Continue with Figma
                    </button>

                    <p className="text-center text-xs text-gray-500">
                        Sign in with your Figma account to access your design files
                    </p>
                </div>
            </div>
        </div>
    );
}
