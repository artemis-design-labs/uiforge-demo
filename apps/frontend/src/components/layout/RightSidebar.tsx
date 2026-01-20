'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import PropertiesPanel from '@/components/PropertiesPanel';
import { ComponentProperties } from '@/types/component';
import { useAppDispatch } from '@/store/hooks';
import { setRightSidebarWidth } from '@/store/layoutSlice';

interface RightSidebarProps {
  width: number;
  properties: ComponentProperties;
  onPropertyChange: (property: keyof ComponentProperties, value: string | number | boolean) => void;
}

export function RightSidebar({ width, properties, onPropertyChange }: RightSidebarProps) {
  const dispatch = useAppDispatch();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing && sidebarRef.current) {
        const newWidth = window.innerWidth - e.clientX;
        dispatch(setRightSidebarWidth(newWidth));
      }
    },
    [isResizing, dispatch]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <div
      ref={sidebarRef}
      className="border-l border-border bg-background flex flex-col relative"
      style={{ width: `${width}px`, minWidth: '300px', maxWidth: '900px' }}
    >
      {/* Resize Handle */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors z-10 ${
          isResizing ? 'bg-blue-500' : 'bg-transparent hover:bg-blue-400/50'
        }`}
        onMouseDown={startResizing}
        title="Drag to resize"
      />

      {/* Sidebar Header */}
      <div className="h-12 border-b border-border px-4 flex items-center justify-between">
        <h3 className="font-medium text-sm">Properties</h3>
        <span className="text-xs text-muted-foreground">{width}px</span>
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
