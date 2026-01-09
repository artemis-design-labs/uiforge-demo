'use client';
import PropertiesPanel from '@/components/PropertiesPanel';
import { ComponentProperties } from '@/types/component';

interface RightSidebarProps {
  width: number;
  properties: ComponentProperties;
  onPropertyChange: (property: keyof ComponentProperties, value: string | number | boolean) => void;
}

export function RightSidebar({ width, properties, onPropertyChange }: RightSidebarProps) {
  return (
    <div
      className="border-l border-border bg-background flex flex-col"
      style={{ width: `${width}px` }}
    >
      {/* Sidebar Header */}
      <div className="h-12 border-b border-border px-4 flex items-center">
        <h3 className="font-medium text-sm">Properties</h3>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-auto">
        <PropertiesPanel
          properties={properties}
          onPropertyChange={onPropertyChange}
        />
      </div>
    </div>
  );
}