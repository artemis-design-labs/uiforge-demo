'use client';
import { useCallback, useRef, useEffect } from 'react';
import FigmaTreeView from '@/components/FigmaTreeView';
import { useAppDispatch } from '@/store/hooks';
import { setLeftSidebarWidth } from '@/store/layoutSlice';

interface LeftSidebarProps {
  width: number;
}

export function LeftSidebar({ width }: LeftSidebarProps) {
  const dispatch = useAppDispatch();
  const isResizing = useRef(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX;
    dispatch(setLeftSidebarWidth(newWidth));
  }, [dispatch]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <div
      ref={sidebarRef}
      className="border-r border-border bg-background flex flex-col relative"
      style={{ width: `${width}px`, minWidth: '200px', maxWidth: '800px' }}
    >
      {/* Sidebar Header */}
      <div className="h-12 border-b border-border px-4 flex items-center">
        <h3 className="font-medium text-sm">Components</h3>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-auto">
        <FigmaTreeView />
      </div>

      {/* Resize Handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors"
        onMouseDown={startResizing}
      />
    </div>
  );
}