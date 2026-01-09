export function AppToolbar() {
  return (
    <div className="h-12 border-b border-border bg-muted/30 px-4 flex items-center gap-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>Home</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-foreground">Current Page</span>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Toolbar Actions */}
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          Action
        </button>
        <button className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent">
          Secondary
        </button>
      </div>
    </div>
  );
}