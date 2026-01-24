'use client';

import { useMemo } from 'react';
import type { IdentifiedComponent, ConfidenceLevel } from '@/types/screenshotAnalyzer';

interface ComponentTreeProps {
  components: IdentifiedComponent[];
  selectedId: string | null;
  expandedIds: string[];
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
}

export function ComponentTree({
  components,
  selectedId,
  expandedIds,
  onSelect,
  onToggleExpand,
}: ComponentTreeProps) {
  // Find root components (no parent)
  const rootComponents = useMemo(() => {
    return components.filter((c) => c.parentId === null);
  }, [components]);

  // Build a map for quick child lookup
  const childrenMap = useMemo(() => {
    const map = new Map<string, IdentifiedComponent[]>();
    components.forEach((c) => {
      if (c.parentId) {
        const children = map.get(c.parentId) || [];
        children.push(c);
        map.set(c.parentId, children);
      }
    });
    return map;
  }, [components]);

  return (
    <div className="py-2">
      {rootComponents.length === 0 ? (
        <div className="px-4 py-8 text-center text-muted-foreground">
          <p>No components found</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {rootComponents.map((component) => (
            <TreeNode
              key={component.id}
              component={component}
              childrenMap={childrenMap}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              depth={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Tree Node Component
// ============================================

interface TreeNodeProps {
  component: IdentifiedComponent;
  childrenMap: Map<string, IdentifiedComponent[]>;
  selectedId: string | null;
  expandedIds: string[];
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  depth: number;
}

function TreeNode({
  component,
  childrenMap,
  selectedId,
  expandedIds,
  onSelect,
  onToggleExpand,
  depth,
}: TreeNodeProps) {
  const children = childrenMap.get(component.id) || [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.includes(component.id);
  const isSelected = selectedId === component.id;

  return (
    <div>
      {/* Node row */}
      <div
        className={`
          flex items-center gap-1 px-2 py-1.5 cursor-pointer
          transition-colors rounded-md mx-1
          ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}
        `}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelect(component.id)}
      >
        {/* Expand/collapse button */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(component.id);
            }}
            className="p-0.5 rounded hover:bg-muted-foreground/10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Component icon */}
        <ComponentIcon type={component.type} />

        {/* Component name */}
        <span className="flex-1 truncate text-sm font-medium">{component.name}</span>

        {/* Confidence badge */}
        <ConfidenceBadge level={component.confidenceLevel} score={component.confidence} />

        {/* Match indicator */}
        {component.bestMatch && (
          <MatchIndicator source={component.bestMatch.source} />
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              component={child}
              childrenMap={childrenMap}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Helper Components
// ============================================

function ComponentIcon({ type }: { type: string }) {
  const normalizedType = type.toLowerCase();

  // Choose icon based on type
  let iconPath: React.ReactNode;
  switch (normalizedType) {
    case 'button':
    case 'btn':
      iconPath = (
        <>
          <rect width="12" height="6" x="6" y="9" rx="1" />
        </>
      );
      break;
    case 'input':
    case 'textfield':
      iconPath = (
        <>
          <rect width="16" height="8" x="4" y="8" rx="2" />
          <line x1="8" y1="12" x2="8" y2="12" />
        </>
      );
      break;
    case 'card':
      iconPath = (
        <>
          <rect width="16" height="12" x="4" y="6" rx="2" />
          <line x1="8" y1="10" x2="16" y2="10" />
        </>
      );
      break;
    case 'nav':
    case 'navbar':
    case 'navigation':
      iconPath = (
        <>
          <rect width="18" height="4" x="3" y="4" rx="1" />
          <line x1="7" y1="6" x2="17" y2="6" />
        </>
      );
      break;
    case 'list':
      iconPath = (
        <>
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </>
      );
      break;
    case 'image':
    case 'img':
      iconPath = (
        <>
          <rect width="18" height="14" x="3" y="5" rx="2" />
          <circle cx="9" cy="10" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </>
      );
      break;
    default:
      iconPath = (
        <>
          <rect width="16" height="16" x="4" y="4" rx="2" />
        </>
      );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 text-muted-foreground flex-shrink-0"
    >
      {iconPath}
    </svg>
  );
}

function ConfidenceBadge({ level, score }: { level: ConfidenceLevel; score: number }) {
  const colorClasses = {
    high: 'bg-green-500/10 text-green-600',
    medium: 'bg-yellow-500/10 text-yellow-600',
    low: 'bg-red-500/10 text-red-600',
  };

  return (
    <span
      className={`px-1.5 py-0.5 text-xs rounded ${colorClasses[level]}`}
      title={`Confidence: ${score}%`}
    >
      {score}%
    </span>
  );
}

function MatchIndicator({ source }: { source: 'codebase' | 'figma' | 'inferred' }) {
  const config = {
    codebase: { color: 'text-blue-500', label: 'C', title: 'Matched to codebase' },
    figma: { color: 'text-purple-500', label: 'F', title: 'Matched to Figma' },
    inferred: { color: 'text-gray-500', label: 'I', title: 'Inferred' },
  };

  const { color, label, title } = config[source];

  return (
    <span
      className={`w-5 h-5 flex items-center justify-center text-xs font-bold rounded ${color} bg-current/10`}
      title={title}
    >
      {label}
    </span>
  );
}

// ============================================
// Export Tree Controls
// ============================================

interface TreeControlsProps {
  onExpandAll: () => void;
  onCollapseAll: () => void;
  totalCount: number;
  matchedCount: number;
}

export function TreeControls({
  onExpandAll,
  onCollapseAll,
  totalCount,
  matchedCount,
}: TreeControlsProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border">
      <div className="text-sm text-muted-foreground">
        {totalCount} components ({matchedCount} matched)
      </div>
      <div className="flex gap-1">
        <button
          onClick={onExpandAll}
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="Expand all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="m3 8 4-4 4 4" />
            <path d="M7 4v16" />
            <path d="m21 16-4 4-4-4" />
            <path d="M17 20V4" />
          </svg>
        </button>
        <button
          onClick={onCollapseAll}
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="Collapse all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="m3 16 4 4 4-4" />
            <path d="M7 20V4" />
            <path d="m21 8-4-4-4 4" />
            <path d="M17 4v16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
