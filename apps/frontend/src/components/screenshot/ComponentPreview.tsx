'use client';

import { useMemo } from 'react';
import { Sandpack } from '@codesandbox/sandpack-react';
import type { IdentifiedComponent } from '@/types/screenshotAnalyzer';
import { generatePreviewCode } from '@/services/screenshotAnalyzer';

interface ComponentPreviewProps {
  component: IdentifiedComponent;
  props: Record<string, unknown>;
  onPropsChange?: (props: Record<string, unknown>) => void;
}

export function ComponentPreview({
  component,
  props,
}: ComponentPreviewProps) {
  // Generate code for the component
  const code = useMemo(() => {
    return generatePreviewCode(component);
  }, [component]);

  // Build the App.tsx that renders the component
  const appCode = useMemo(() => {
    const componentName = toPascalCase(component.name);
    const propsString = Object.entries(props)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}="${value}"`;
        } else if (typeof value === 'boolean') {
          return value ? key : `${key}={false}`;
        } else if (value !== undefined) {
          return `${key}={${JSON.stringify(value)}}`;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n        ');

    return `import { ${componentName} } from './Component';

export default function App() {
  return (
    <div className="p-4">
      <${componentName}
        ${propsString}
      />
    </div>
  );
}
`;
  }, [component.name, props]);

  // Tailwind CSS setup
  const indexCSS = `
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: system-ui, -apple-system, sans-serif;
}
`;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <h3 className="text-sm font-medium">Live Preview</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {component.name} - {component.type}
        </p>
      </div>

      {/* Sandpack Preview */}
      <div className="flex-1 overflow-hidden">
        {/* @ts-expect-error Sandpack types incompatible with React 19 */}
        <Sandpack
          template="react-ts"
          theme="dark"
          options={{
            showNavigator: false,
            showTabs: true,
            showLineNumbers: true,
            editorHeight: '100%',
            editorWidthPercentage: 50,
            externalResources: [
              'https://cdn.tailwindcss.com',
            ],
          }}
          files={{
            '/App.tsx': {
              code: appCode,
              active: false,
            },
            '/Component.tsx': {
              code: code,
              active: true,
            },
            '/styles.css': {
              code: indexCSS,
              hidden: true,
            },
          }}
          customSetup={{
            dependencies: {
              react: '^18.2.0',
              'react-dom': '^18.2.0',
            },
          }}
        />
      </div>
    </div>
  );
}

// ============================================
// Simple Preview (without full Sandpack)
// ============================================

interface SimplePreviewProps {
  component: IdentifiedComponent;
}

export function SimplePreview({ component }: SimplePreviewProps) {
  // Render a simple representation based on component type
  const { type, name, inferredProps } = component;
  const normalizedType = type.toLowerCase();

  const renderPreview = () => {
    switch (normalizedType) {
      case 'button':
      case 'btn':
        return (
          <button
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${
                inferredProps.variant === 'primary'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : inferredProps.variant === 'secondary'
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : inferredProps.variant === 'outline'
                  ? 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {String(inferredProps.label || name)}
          </button>
        );

      case 'input':
      case 'textfield':
        return (
          <input
            type="text"
            placeholder={String(inferredProps.placeholder || 'Enter text...')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'card':
        return (
          <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
            <h3 className="font-semibold">{String(inferredProps.title || name)}</h3>
            <p className="text-gray-600 text-sm mt-2">Card content goes here</p>
          </div>
        );

      case 'nav':
      case 'navbar':
      case 'navigation':
        return (
          <nav className="flex items-center gap-4 px-4 py-3 bg-white border-b border-gray-200">
            <span className="font-bold">Logo</span>
            <div className="flex gap-4">
              <a href="#" className="text-gray-600 hover:text-gray-900">Home</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">About</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Contact</a>
            </div>
          </nav>
        );

      default:
        return (
          <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
            <p className="text-gray-500 text-center">{name}</p>
            <p className="text-gray-400 text-xs text-center mt-1">{type}</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <h3 className="text-sm font-medium">Preview</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {component.name} - {component.type}
        </p>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        {renderPreview()}
      </div>
    </div>
  );
}

// ============================================
// Helper Functions
// ============================================

function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

// ============================================
// No Selection State
// ============================================

export function NoComponentSelected() {
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
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="m9 9 6 6" />
        <path d="m15 9-6 6" />
      </svg>
      <p className="text-center">Select a component from the tree or screenshot to see its preview</p>
    </div>
  );
}
