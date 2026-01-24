'use client';

import { useState } from 'react';
import type { CodebaseAnalysis, ExtractedComponent } from '@/types/codebaseAnalyzer';
import { ComponentList, ComponentDetail } from './ComponentList';

interface AnalysisResultsProps {
  analysis: CodebaseAnalysis;
}

type Tab = 'components' | 'patterns' | 'structure';

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('components');
  const [selectedComponentPath, setSelectedComponentPath] = useState<string | null>(null);

  const selectedComponent = selectedComponentPath
    ? analysis.components.find((c) => `${c.filePath}:${c.name}` === selectedComponentPath)
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header with framework info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{analysis.name}</h3>
            <p className="text-sm text-muted-foreground">
              {analysis.fileCount} files analyzed
            </p>
          </div>

          {/* Framework badge */}
          <div className="flex items-center gap-2">
            <FrameworkBadge
              framework={analysis.framework.detected}
              version={analysis.framework.version}
              metaFramework={analysis.framework.metaFramework}
              confidence={analysis.framework.confidence}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['components', 'patterns', 'structure'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-1 px-4 py-3 text-sm font-medium transition-colors
              ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }
            `}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'components' && (
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-muted">
                {analysis.components.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'components' && (
          <div className="flex h-full">
            {/* Component list */}
            <div className="w-1/2 border-r border-border overflow-hidden">
              <ComponentList
                components={analysis.components}
                selectedPath={selectedComponentPath}
                onSelect={setSelectedComponentPath}
              />
            </div>

            {/* Component detail */}
            <div className="w-1/2 overflow-y-auto">
              {selectedComponent ? (
                <ComponentDetail component={selectedComponent} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Select a component to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="p-4 overflow-y-auto">
            <PatternsPanel patterns={analysis.patterns} />
          </div>
        )}

        {activeTab === 'structure' && (
          <div className="p-4 overflow-y-auto">
            <StructurePanel
              structure={analysis.structure}
              dependencies={analysis.dependencies}
              entryPoints={analysis.entryPoints}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Framework badge component
function FrameworkBadge({
  framework,
  version,
  metaFramework,
  confidence,
}: {
  framework: string;
  version?: string;
  metaFramework?: string;
  confidence: number;
}) {
  const frameworkColors: Record<string, string> = {
    react: 'bg-blue-500',
    vue: 'bg-green-500',
    angular: 'bg-red-500',
    svelte: 'bg-orange-500',
    unknown: 'bg-gray-500',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-sm font-medium
          ${frameworkColors[framework] || frameworkColors.unknown}
        `}
      >
        <span className="capitalize">{framework}</span>
        {version && <span className="opacity-75">{version}</span>}
      </div>
      {metaFramework && (
        <span className="px-2 py-1 text-xs rounded bg-muted text-muted-foreground">
          {metaFramework}
        </span>
      )}
      <span className="text-xs text-muted-foreground">
        {confidence}% confidence
      </span>
    </div>
  );
}

// Patterns panel component
function PatternsPanel({ patterns }: { patterns: CodebaseAnalysis['patterns'] }) {
  return (
    <div className="space-y-6">
      {/* State Management */}
      <PatternSection
        title="State Management"
        value={patterns.stateManagement}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        }
      />

      {/* Styling */}
      <PatternSection
        title="Styling"
        value={patterns.styling}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        }
      />

      {/* Routing */}
      <PatternSection
        title="Routing"
        value={patterns.routing}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" x2="21" y1="14" y2="3" />
          </svg>
        }
      />

      {/* API Patterns */}
      {patterns.apiPatterns.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9" />
            </svg>
            API Patterns
          </h4>
          <div className="flex flex-wrap gap-2">
            {patterns.apiPatterns.map((pattern) => (
              <span
                key={pattern}
                className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm"
              >
                {pattern}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Build Tools */}
      {patterns.buildTools.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            Build Tools
          </h4>
          <div className="flex flex-wrap gap-2">
            {patterns.buildTools.map((tool) => (
              <span
                key={tool}
                className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Testing */}
      {patterns.testingFrameworks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            Testing
          </h4>
          <div className="flex flex-wrap gap-2">
            {patterns.testingFrameworks.map((framework) => (
              <span
                key={framework}
                className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 text-sm"
              >
                {framework}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Other Patterns */}
      {patterns.otherPatterns.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Other Patterns</h4>
          <div className="flex flex-wrap gap-2">
            {patterns.otherPatterns.map((pattern) => (
              <span
                key={pattern}
                className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm"
              >
                {pattern}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PatternSection({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  const isNone = value === 'none' || value === 'unknown';

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <span className="font-medium">{title}</span>
      </div>
      <span
        className={`
          px-3 py-1 rounded-full text-sm
          ${isNone ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}
        `}
      >
        {value}
      </span>
    </div>
  );
}

// Structure panel component
function StructurePanel({
  structure,
  dependencies,
  entryPoints,
}: {
  structure: CodebaseAnalysis['structure'];
  dependencies: CodebaseAnalysis['dependencies'];
  entryPoints: string[];
}) {
  return (
    <div className="space-y-6">
      {/* Project Structure */}
      <div>
        <h4 className="text-sm font-medium mb-3">Project Structure</h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Source Dir', value: structure.sourceDir },
            { label: 'Components', value: structure.componentsDir },
            { label: 'Pages/Routes', value: structure.pagesDir },
            { label: 'Styles', value: structure.stylesDir },
            { label: 'Utils', value: structure.utilsDir },
            { label: 'API/Services', value: structure.apiDir },
            { label: 'Store', value: structure.storeDir },
          ].map(
            (item) =>
              item.value && (
                <div
                  key={item.label}
                  className="p-3 rounded-lg bg-muted/50"
                >
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-mono">{item.value}</p>
                </div>
              )
          )}
        </div>
      </div>

      {/* Entry Points */}
      {entryPoints.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Entry Points</h4>
          <div className="space-y-2">
            {entryPoints.map((entry) => (
              <div
                key={entry}
                className="p-2 rounded-lg bg-muted/50 text-sm font-mono"
              >
                {entry}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Config Files */}
      {structure.configFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Config Files</h4>
          <div className="flex flex-wrap gap-2">
            {structure.configFiles.map((file) => (
              <span
                key={file}
                className="px-2 py-1 text-xs rounded bg-muted font-mono"
              >
                {file}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Dependencies */}
      {dependencies.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">
            Dependencies ({dependencies.length})
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-1 p-2 rounded-lg bg-muted/30">
            {dependencies
              .filter((d) => !d.isDev)
              .slice(0, 30)
              .map((dep) => (
                <div
                  key={dep.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-mono">{dep.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {dep.version}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
