'use client';

import { useAppSelector } from '@/store/hooks';
import { AppHeader } from './AppHeader';
import { AppToolbar } from './AppToolbar';
import { AppMain } from './AppMain';
import { ComponentProperties } from '@/types/component';

interface AppLayoutProps {
  children: React.ReactNode;
  componentProperties: ComponentProperties;
  onPropertyChange: (property: keyof ComponentProperties, value: string | number | boolean) => void;
}

export function AppLayout({ children, componentProperties, onPropertyChange }: AppLayoutProps) {
  const { isMobile } = useAppSelector((state) => state.layout);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <AppHeader />

      {/* Toolbar */}
      <AppToolbar />

      {/* Main Content Area */}
      <AppMain
        componentProperties={componentProperties}
        onPropertyChange={onPropertyChange}
      >
        {children}
      </AppMain>
    </div>
  );
}