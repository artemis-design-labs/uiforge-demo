interface MainContentProps {
  children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Main content header (optional) */}
      <div className="h-10 border-b border-border bg-muted/20 px-4 flex items-center">
        <div className="text-xs text-muted-foreground">Main Content Area</div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-auto p-4">
        {children}
      </div>
    </div>
  );
}