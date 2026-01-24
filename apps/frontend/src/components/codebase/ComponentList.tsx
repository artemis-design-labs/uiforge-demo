'use client';

import { useState, useMemo } from 'react';
import type { ExtractedComponent } from '@/types/codebaseAnalyzer';

interface ComponentListProps {
  components: ExtractedComponent[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

export function ComponentList({ components, selectedPath, onSelect }: ComponentListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Get unique component types
  const componentTypes = useMemo(() => {
    const types = new Set(components.map((c) => c.type));
    return ['all', ...Array.from(types)];
  }, [components]);

  // Filter components
  const filteredComponents = useMemo(() => {
    return components.filter((component) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.filePath.toLowerCase().includes(searchQuery.toLowerCase());

      // Type filter
      const matchesType = filterType === 'all' || component.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [components, searchQuery, filterType]);

  // Group components by directory
  const groupedComponents = useMemo(() => {
    const groups: Record<string, ExtractedComponent[]> = {};

    for (const component of filteredComponents) {
      const pathParts = component.filePath.split('/');
      const dir = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : 'root';

      if (!groups[dir]) {
        groups[dir] = [];
      }
      groups[dir].push(component);
    }

    // Sort directories and components
    const sortedGroups: Record<string, ExtractedComponent[]> = {};
    for (const dir of Object.keys(groups).sort()) {
      sortedGroups[dir] = groups[dir].sort((a, b) => a.name.localeCompare(b.name));
    }

    return sortedGroups;
  }, [filteredComponents]);

  return (
    <div className="flex flex-col h-full">
      {/* Search and filter */}
      <div className="p-4 space-y-3 border-b border-border">
        {/* Search input */}
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Type filter */}
        <div className="flex gap-2 flex-wrap">
          {componentTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`
                px-3 py-1 text-xs rounded-full transition-colors
                ${
                  filterType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
            >
              {type === 'all' ? 'All' : type}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground">
          {filteredComponents.length} of {components.length} components
        </p>
      </div>

      {/* Component list */}
      <div className="flex-1 overflow-y-auto">
        {Object.keys(groupedComponents).length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No components found</p>
          </div>
        ) : (
          Object.entries(groupedComponents).map(([dir, dirComponents]) => (
            <div key={dir} className="border-b border-border last:border-0">
              {/* Directory header */}
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                {dir}
              </div>

              {/* Components in directory */}
              {dirComponents.map((component) => (
                <button
                  key={`${component.filePath}:${component.name}`}
                  onClick={() => onSelect(`${component.filePath}:${component.name}`)}
                  className={`
                    w-full px-4 py-3 text-left transition-colors
                    hover:bg-muted/50
                    ${selectedPath === `${component.filePath}:${component.name}` ? 'bg-primary/10 border-l-2 border-primary' : ''}
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{component.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {component.filePath.split('/').pop()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Component type badge */}
                      <span
                        className={`
                          px-2 py-0.5 text-xs rounded
                          ${
                            component.type === 'functional'
                              ? 'bg-blue-500/10 text-blue-500'
                              : component.type === 'class'
                              ? 'bg-purple-500/10 text-purple-500'
                              : component.type === 'sfc'
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-muted text-muted-foreground'
                          }
                        `}
                      >
                        {component.type}
                      </span>

                      {/* Props count */}
                      {component.props.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {component.props.length} props
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Additional info */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {component.hasStyles && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        styled
                      </span>
                    )}
                    {component.hooks.length > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {component.hooks.length} hooks
                      </span>
                    )}
                    {component.childComponents.length > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {component.childComponents.length} children
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Component detail panel
interface ComponentDetailProps {
  component: ExtractedComponent;
}

export function ComponentDetail({ component }: ComponentDetailProps) {
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">{component.name}</h3>
        <p className="text-sm text-muted-foreground">{component.filePath}</p>
      </div>

      {/* Type and styling */}
      <div className="flex gap-2">
        <span
          className={`
            px-3 py-1 text-sm rounded-full
            ${
              component.type === 'functional'
                ? 'bg-blue-500/10 text-blue-500'
                : component.type === 'class'
                ? 'bg-purple-500/10 text-purple-500'
                : 'bg-green-500/10 text-green-500'
            }
          `}
        >
          {component.type}
        </span>
        {component.styleApproach && component.styleApproach !== 'unknown' && (
          <span className="px-3 py-1 text-sm rounded-full bg-muted text-muted-foreground">
            {component.styleApproach}
          </span>
        )}
      </div>

      {/* Props */}
      {component.props.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Props ({component.props.length})</h4>
          <div className="space-y-2">
            {component.props.map((prop) => (
              <div
                key={prop.name}
                className="p-2 rounded-lg bg-muted/50 text-sm"
              >
                <div className="flex items-center gap-2">
                  <code className="font-mono font-medium">{prop.name}</code>
                  {prop.required && (
                    <span className="text-xs text-destructive">required</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  {prop.type}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hooks */}
      {component.hooks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Hooks ({component.hooks.length})</h4>
          <div className="flex flex-wrap gap-2">
            {component.hooks.map((hook) => (
              <span
                key={hook}
                className="px-2 py-1 text-xs rounded bg-muted font-mono"
              >
                {hook}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* State usage */}
      {component.stateUsage.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">State Management</h4>
          <div className="flex flex-wrap gap-2">
            {component.stateUsage.map((state) => (
              <span
                key={state}
                className="px-2 py-1 text-xs rounded bg-primary/10 text-primary"
              >
                {state}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Child components */}
      {component.childComponents.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">
            Child Components ({component.childComponents.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {component.childComponents.map((child) => (
              <span
                key={child}
                className="px-2 py-1 text-xs rounded bg-muted"
              >
                {child}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Imports */}
      {component.imports.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Imports ({component.imports.length})</h4>
          <div className="p-3 rounded-lg bg-muted/50 max-h-40 overflow-y-auto">
            {component.imports.map((imp, i) => (
              <p key={i} className="text-xs font-mono text-muted-foreground">
                {imp}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
