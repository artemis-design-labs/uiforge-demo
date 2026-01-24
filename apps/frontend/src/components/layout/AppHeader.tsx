'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleLeftSidebar, toggleRightSidebar } from '@/store/layoutSlice';
import { openModal as openCodebaseModal } from '@/store/codebaseSlice';
import { openModal as openScreenshotModal } from '@/store/screenshotSlice';
import { UserDropdown } from './UserDropdown';
import { PackageGeneratorModal } from '@/components/PackageGeneratorModal';
import { CodebaseAnalyzerModal } from '@/components/CodebaseAnalyzerModal';
import { ScreenshotAnalyzerModal } from '@/components/screenshot/ScreenshotAnalyzerModal';

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
          {/* Screenshot Analyzer Button */}
          <button
            onClick={() => dispatch(openScreenshotModal())}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            <ScreenshotIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Screenshot Analyzer</span>
          </button>

          {/* Analyze Codebase Button */}
          <button
            onClick={() => dispatch(openCodebaseModal())}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            <CodebaseIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Analyze Codebase</span>
          </button>

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

      {/* Codebase Analyzer Modal */}
      <CodebaseAnalyzerModal />

      {/* Screenshot Analyzer Modal */}
      <ScreenshotAnalyzerModal />
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

function CodebaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  );
}

function ScreenshotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}
