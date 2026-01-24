'use client';

import { useState, useMemo } from 'react';
import type { IdentifiedComponent, ComponentMatch } from '@/types/screenshotAnalyzer';
import { generatePreviewCode } from '@/services/screenshotAnalyzer';
import CodeDisplay from '@/components/CodeDisplay';

interface IdentifiedComponentDetailProps {
  component: IdentifiedComponent;
  props: Record<string, unknown>;
  onPropsChange: (props: Record<string, unknown>) => void;
}

export function IdentifiedComponentDetail({
  component,
  props,
  onPropsChange,
}: IdentifiedComponentDetailProps) {
  const [activeTab, setActiveTab] = useState<'props' | 'matches' | 'code'>('props');

  // Generate code
  const generatedCode = useMemo(() => {
    return generatePreviewCode(component);
  }, [component]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <ConfidenceBadge level={component.confidenceLevel} score={component.confidence} />
          <div>
            <h3 className="font-semibold">{component.name}</h3>
            <p className="text-xs text-muted-foreground">{component.type}</p>
          </div>
        </div>
        {component.visualDescription && (
          <p className="text-sm text-muted-foreground mt-2 italic">
            &quot;{component.visualDescription}&quot;
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['props', 'matches', 'code'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-1 px-4 py-2 text-sm font-medium transition-colors
              ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }
            `}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'matches' && component.matches.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-muted">
                {component.matches.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'props' && (
          <PropsPanel
            inferredProps={component.inferredProps}
            currentProps={props}
            onPropsChange={onPropsChange}
          />
        )}
        {activeTab === 'matches' && (
          <MatchesPanel matches={component.matches} bestMatch={component.bestMatch} />
        )}
        {activeTab === 'code' && (
          <CodePanel code={generatedCode} componentName={component.name} />
        )}
      </div>
    </div>
  );
}

// ============================================
// Props Panel
// ============================================

interface PropsPanelProps {
  inferredProps: Record<string, string | boolean | number>;
  currentProps: Record<string, unknown>;
  onPropsChange: (props: Record<string, unknown>) => void;
}

function PropsPanel({ inferredProps, currentProps, onPropsChange }: PropsPanelProps) {
  const handlePropChange = (key: string, value: unknown) => {
    onPropsChange({ ...currentProps, [key]: value });
  };

  const allProps = { ...inferredProps, ...currentProps };

  if (Object.keys(allProps).length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No properties inferred for this component</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h4 className="text-sm font-medium text-muted-foreground">Inferred Properties</h4>
      <div className="space-y-3">
        {Object.entries(allProps).map(([key, value]) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-sm font-medium">{key}</label>
            {typeof value === 'boolean' ? (
              <button
                onClick={() => handlePropChange(key, !value)}
                className={`
                  w-12 h-6 rounded-full transition-colors relative
                  ${value ? 'bg-primary' : 'bg-muted'}
                `}
              >
                <span
                  className={`
                    absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                    ${value ? 'left-7' : 'left-1'}
                  `}
                />
              </button>
            ) : typeof value === 'number' ? (
              <input
                type="number"
                value={value}
                onChange={(e) => handlePropChange(key, Number(e.target.value))}
                className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            ) : (
              <input
                type="text"
                value={String(value)}
                onChange={(e) => handlePropChange(key, e.target.value)}
                className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Matches Panel
// ============================================

interface MatchesPanelProps {
  matches: ComponentMatch[];
  bestMatch: ComponentMatch | null;
}

function MatchesPanel({ matches, bestMatch }: MatchesPanelProps) {
  if (matches.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No matches found in your codebase or Figma</p>
        <p className="text-xs mt-2">
          This component may need to be created from scratch
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Best match highlight */}
      {bestMatch && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-primary">Best Match</span>
            <SourceBadge source={bestMatch.source} />
          </div>
          <p className="font-medium">{bestMatch.componentName}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {bestMatch.matchScore}% match
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {bestMatch.matchReasons.map((reason, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded bg-muted">
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Other matches */}
      {matches.length > 1 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Other Matches
          </h4>
          <div className="space-y-2">
            {matches
              .filter((m) => m !== bestMatch)
              .map((match, index) => (
                <div
                  key={index}
                  className="p-2 rounded-lg bg-muted/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <SourceBadge source={match.source} />
                    <span className="text-sm">{match.componentName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {match.matchScore}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Code Panel
// ============================================

interface CodePanelProps {
  code: string;
  componentName: string;
}

function CodePanel({ code, componentName }: CodePanelProps) {
  return (
    <div className="p-4">
      <CodeDisplay
        code={code}
        language="tsx"
        title={`${componentName}.tsx`}
        showLineNumbers
      />
    </div>
  );
}

// ============================================
// Helper Components
// ============================================

function ConfidenceBadge({
  level,
  score,
}: {
  level: 'high' | 'medium' | 'low';
  score: number;
}) {
  const colors = {
    high: 'bg-green-500/10 text-green-600 border-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    low: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded border ${colors[level]}`}
    >
      {score}% confidence
    </span>
  );
}

function SourceBadge({ source }: { source: 'codebase' | 'figma' | 'inferred' }) {
  const config = {
    codebase: { bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'Codebase' },
    figma: { bg: 'bg-purple-500/10', text: 'text-purple-600', label: 'Figma' },
    inferred: { bg: 'bg-gray-500/10', text: 'text-gray-600', label: 'Inferred' },
  };

  const { bg, text, label } = config[source];

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${bg} ${text}`}>
      {label}
    </span>
  );
}

// ============================================
// Export Placeholder Component
// ============================================

export function NoComponentSelectedDetail() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-12 h-12 mb-4 opacity-50"
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" x2="8" y1="13" y2="13" />
        <line x1="16" x2="8" y1="17" y2="17" />
        <line x1="10" x2="8" y1="9" y2="9" />
      </svg>
      <p className="text-center">
        Select a component to view its properties, matches, and generated code
      </p>
    </div>
  );
}
