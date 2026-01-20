'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleLeftSidebar, toggleRightSidebar } from '@/store/layoutSlice';
import { UserDropdown } from './UserDropdown';
import { PackageGeneratorModal } from '@/components/PackageGeneratorModal';

export function AppHeader() {
  const dispatch = useAppDispatch();
  const { isMobile } = useAppSelector((state) => state.layout);
  const { user } = useAppSelector((state) => state.auth);
  const { fileComponentDefinitions, currentFileKey } = useAppSelector((state) => state.figma);
  const [showPackageModal, setShowPackageModal] = useState(false);

  const componentCount = Object.keys(fileComponentDefinitions).length;
  const hasComponents = componentCount > 0;

  return (
    <>
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

          {/* Component count badge */}
          {hasComponents && (
            <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full">
              {componentCount} components
            </span>
          )}
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
        <div className="flex items-center gap-3">
          {/* Generate Package Button */}
          {hasComponents && (
            <button
              onClick={() => setShowPackageModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              <PackageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Generate Package</span>
            </button>
          )}

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

      {/* Package Generator Modal */}
      <PackageGeneratorModal
        isOpen={showPackageModal}
        onClose={() => setShowPackageModal(false)}
      />
    </>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
