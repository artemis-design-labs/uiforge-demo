import FigmaTreeView from '@/components/FigmaTreeView';

interface LeftSidebarProps {
  width: number;
}

export function LeftSidebar({ width }: LeftSidebarProps) {
  return (
    <div 
      className="border-r border-border bg-background flex flex-col"
      style={{ width: `${width}px` }}
    >
      {/* Sidebar Header */}
      <div className="h-12 border-b border-border px-4 flex items-center">
        <h3 className="font-medium text-sm">Figma Files</h3>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-auto">
        <FigmaTreeView />
      </div>
    </div>
  );
}