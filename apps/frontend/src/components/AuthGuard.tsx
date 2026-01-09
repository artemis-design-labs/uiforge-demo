'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { loginSuccess, loginFailure } from '@/store/authSlice';
import { authService } from '@/services/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    // If already authenticated, just mark as initialized
    if (isAuthenticated) {
      setIsInitialized(true);
      return;
    }

    // If already checked auth, don't run again
    if (hasCheckedAuth.current) {
      return;
    }

    const initializeAuth = async () => {
      hasCheckedAuth.current = true;
      
      try {
        const userData = await authService.checkAuth();
        dispatch(loginSuccess(userData.user));
      } catch (err) {
        dispatch(loginFailure('Not authenticated'));
        router.push('/login');
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []); // Empty dependency array - only run once on mount

  // Show loading while checking authentication
  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Checking authentication...</div>
      </div>
    );
  }

  // If not authenticated, show redirect message
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Redirecting to login...</div>
      </div>
    );
  }

  // User is authenticated, show the protected content
  return <>{children}</>;
}