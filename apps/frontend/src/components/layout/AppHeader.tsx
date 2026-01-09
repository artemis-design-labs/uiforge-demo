'use client';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleLeftSidebar, toggleRightSidebar } from '@/store/layoutSlice';
import { UserDropdown } from './UserDropdown';

export function AppHeader() {
  const dispatch = useAppDispatch();
  const { isMobile } = useAppSelector((state) => state.layout);
  const { user } = useAppSelector((state) => state.auth);

  return (
    <header className="h-14 border-b border-border bg-background px-4 flex items-center justify-between">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => dispatch(toggleLeftSidebar())}
          className="p-2 hover:bg-accent rounded-md"
          aria-label="Toggle left sidebar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="font-semibold text-foreground">
          UIForge AI
        </div>
      </div>

      {/* Center Section */}
      <div className="flex-1 flex justify-center">
        {user && (
          <div className="text-sm text-muted-foreground">
            Welcome back, {user.name}
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch(toggleRightSidebar())}
          className="p-2 hover:bg-accent rounded-md"
          aria-label="Toggle right sidebar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        <UserDropdown />
      </div>
    </header>
  );
}