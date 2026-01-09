'use client';

import { useAppSelector } from '@/store/hooks';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { MainContent } from './MainContent';
import { ComponentProperties } from '@/types/component';

interface AppMainProps {
  children: React.ReactNode;
  componentProperties: ComponentProperties;
  onPropertyChange: (property: keyof ComponentProperties, value: string | number | boolean) => void;
}

export function AppMain({ children, componentProperties, onPropertyChange }: AppMainProps) {
  const {
    leftSidebarCollapsed,
    rightSidebarCollapsed,
    leftSidebarWidth,
    rightSidebarWidth,
    isMobile
  } = useAppSelector((state) => state.layout);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Sidebar */}
      {!leftSidebarCollapsed && (
        <LeftSidebar width={leftSidebarWidth} />
      )}

      {/* Main Content */}
      <MainContent>
        {children}
      </MainContent>

      {/* Right Sidebar */}
      {!rightSidebarCollapsed && (
        <RightSidebar
          width={rightSidebarWidth}
          properties={componentProperties}
          onPropertyChange={onPropertyChange}
        />
      )}
    </div>
  );
}