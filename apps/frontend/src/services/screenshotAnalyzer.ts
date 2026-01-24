/**
 * Screenshot Analyzer Service
 * Handles screenshot analysis and component tree building
 */

import type {
  ScreenshotAnalysis,
  IdentifiedComponent,
  ComponentTreeNode,
  AnalyzeScreenshotRequest,
  AnalyzeScreenshotResponse,
  ScreenshotAnalysisStage,
} from '@/types/screenshotAnalyzer';
import type { ExtractedComponent } from '@/types/codebaseAnalyzer';
import { matchComponents } from './componentMatcher';

// ============================================
// Types
// ============================================

export interface AnalyzeScreenshotOptions {
  codebaseComponents?: ExtractedComponent[];
  figmaComponents?: Record<string, {
    name: string;
    nodeId: string;
    properties: Record<string, unknown>;
  }>;
  onProgress?: (stage: ScreenshotAnalysisStage, progress: number, message?: string) => void;
}

// ============================================
// Main Analysis Function
// ============================================

/**
 * Analyze a screenshot and identify UI components
 */
export async function analyzeScreenshot(
  imageBase64: string,
  fileName: string,
  options: AnalyzeScreenshotOptions = {}
): Promise<AnalyzeScreenshotResponse> {
  const { codebaseComponents, figmaComponents, onProgress } = options;

  try {
    // Stage 1: Uploading
    onProgress?.('uploading', 10, 'Preparing image...');

    // Prepare request body
    const requestBody: AnalyzeScreenshotRequest = {
      image: imageBase64,
      codebaseComponents: codebaseComponents?.map((c) => ({
        name: c.name,
        filePath: c.filePath,
        type: c.type,
        props: c.props,
      })),
      figmaComponents,
    };

    // Stage 2: Analyzing
    onProgress?.('analyzing', 30, 'Analyzing screenshot with AI...');

    // Call the API
    const response = await fetch('/api/screenshot/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...requestBody, fileName }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Analysis failed');
    }

    const result: AnalyzeScreenshotResponse = await response.json();

    if (!result.success || !result.analysis) {
      throw new Error(result.error || 'Analysis failed');
    }

    // Stage 3: Matching
    onProgress?.('matching', 70, 'Matching components to registry...');

    // Run component matching
    const analysisWithMatches = await matchComponents(
      result.analysis,
      codebaseComponents || [],
      figmaComponents || {}
    );

    // Stage 4: Complete
    onProgress?.('complete', 100, 'Analysis complete');

    return {
      success: true,
      analysis: analysisWithMatches,
    };
  } catch (error) {
    console.error('Screenshot analysis error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed',
    };
  }
}

// ============================================
// Tree Building Functions
// ============================================

/**
 * Build a tree structure from flat component list
 */
export function buildComponentTree(
  components: IdentifiedComponent[]
): ComponentTreeNode[] {
  // Create a map for quick lookup
  const componentMap = new Map<string, IdentifiedComponent>();
  components.forEach((c) => componentMap.set(c.id, c));

  // Find root components (no parent)
  const rootComponents = components.filter((c) => c.parentId === null);

  // Recursively build tree
  function buildNode(component: IdentifiedComponent): ComponentTreeNode {
    const children = components
      .filter((c) => c.parentId === component.id)
      .map((child) => buildNode(child));

    return {
      id: component.id,
      name: component.name,
      type: component.type,
      confidence: component.confidence,
      confidenceLevel: component.confidenceLevel,
      hasMatch: component.bestMatch !== null,
      matchSource: component.bestMatch?.source,
      children,
      depth: component.depth,
    };
  }

  return rootComponents.map((root) => buildNode(root));
}

/**
 * Flatten tree back to list (for iteration)
 */
export function flattenTree(nodes: ComponentTreeNode[]): ComponentTreeNode[] {
  const result: ComponentTreeNode[] = [];

  function traverse(node: ComponentTreeNode) {
    result.push(node);
    node.children.forEach(traverse);
  }

  nodes.forEach(traverse);
  return result;
}

// ============================================
// Code Generation
// ============================================

/**
 * Generate preview code for an identified component
 */
export function generatePreviewCode(
  component: IdentifiedComponent
): string {
  const { name, type, inferredProps, bestMatch } = component;

  // If we have a match with source code, use that as a base
  if (bestMatch?.codebaseComponent?.sourceCode) {
    return bestMatch.codebaseComponent.sourceCode;
  }

  // Generate basic component code based on type
  const componentName = toPascalCase(name);
  const propsString = generatePropsString(inferredProps);

  // Generate based on component type
  switch (type.toLowerCase()) {
    case 'button':
      return generateButtonCode(componentName, inferredProps);
    case 'input':
    case 'textfield':
      return generateInputCode(componentName, inferredProps);
    case 'card':
      return generateCardCode(componentName, inferredProps);
    case 'nav':
    case 'navbar':
    case 'navigation':
      return generateNavCode(componentName, inferredProps);
    default:
      return generateGenericCode(componentName, type, propsString, inferredProps);
  }
}

// ============================================
// Code Generation Helpers
// ============================================

function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

function generatePropsString(props: Record<string, string | boolean | number>): string {
  return Object.entries(props)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`;
      } else if (typeof value === 'boolean') {
        return value ? key : `${key}={false}`;
      } else {
        return `${key}={${value}}`;
      }
    })
    .join(' ');
}

function generateButtonCode(
  name: string,
  props: Record<string, string | boolean | number>
): string {
  const variant = props.variant || 'primary';
  const size = props.size || 'medium';
  const label = props.label || 'Button';

  return `'use client';

import React from 'react';

interface ${name}Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function ${name}({
  variant = '${variant}',
  size = '${size}',
  label = '${label}',
  onClick,
  disabled = false,
}: ${name}Props) {
  const baseStyles = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2';

  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    ghost: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
  };

  const sizeStyles = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={\`\${baseStyles} \${variantStyles[variant]} \${sizeStyles[size]} \${disabled ? 'opacity-50 cursor-not-allowed' : ''}\`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

export default ${name};
`;
}

function generateInputCode(
  name: string,
  props: Record<string, string | boolean | number>
): string {
  const placeholder = props.placeholder || 'Enter text...';
  const type = props.inputType || 'text';

  return `'use client';

import React from 'react';

interface ${name}Props {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export function ${name}({
  type = '${type}',
  placeholder = '${placeholder}',
  value = '',
  onChange,
  disabled = false,
  error,
}: ${name}Props) {
  return (
    <div className="w-full">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={\`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 \${
          error ? 'border-red-500' : 'border-gray-300'
        } \${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}\`}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

export default ${name};
`;
}

function generateCardCode(
  name: string,
  props: Record<string, string | boolean | number>
): string {
  const title = props.title || 'Card Title';
  const shadow = props.shadow !== false;

  return `'use client';

import React from 'react';

interface ${name}Props {
  title?: string;
  children?: React.ReactNode;
  shadow?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export function ${name}({
  title = '${title}',
  children,
  shadow = ${shadow},
  padding = 'medium',
}: ${name}Props) {
  const paddingStyles = {
    none: '',
    small: 'p-2',
    medium: 'p-4',
    large: 'p-6',
  };

  return (
    <div
      className={\`bg-white rounded-xl border border-gray-200 \${shadow ? 'shadow-lg' : ''} \${paddingStyles[padding]}\`}
    >
      {title && (
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
      )}
      {children}
    </div>
  );
}

export default ${name};
`;
}

function generateNavCode(
  name: string,
  props: Record<string, string | boolean | number>
): string {
  const variant = props.variant || 'horizontal';
  const sticky = props.sticky || false;

  return `'use client';

import React from 'react';

interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

interface ${name}Props {
  items?: NavItem[];
  variant?: 'horizontal' | 'vertical';
  sticky?: boolean;
  logo?: React.ReactNode;
}

export function ${name}({
  items = [],
  variant = '${variant}',
  sticky = ${sticky},
  logo,
}: ${name}Props) {
  return (
    <nav
      className={\`bg-white border-b border-gray-200 \${sticky ? 'sticky top-0 z-50' : ''}\`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className={\`flex \${variant === 'vertical' ? 'flex-col' : 'items-center justify-between'} h-16\`}>
          {logo && <div className="flex-shrink-0">{logo}</div>}
          <div className={\`flex \${variant === 'vertical' ? 'flex-col space-y-2' : 'space-x-4'}\`}>
            {items.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className={\`px-3 py-2 rounded-md text-sm font-medium transition-colors \${
                  item.active
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }\`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default ${name};
`;
}

function generateGenericCode(
  name: string,
  type: string,
  propsString: string,
  props: Record<string, string | boolean | number>
): string {
  const propsInterface = Object.entries(props)
    .map(([key, value]) => {
      const type = typeof value === 'string' ? 'string' : typeof value === 'boolean' ? 'boolean' : 'number';
      return `  ${key}?: ${type};`;
    })
    .join('\n');

  const propsDestructure = Object.keys(props).join(', ');
  const defaultProps = Object.entries(props)
    .map(([key, value]) => {
      if (typeof value === 'string') return `  ${key} = '${value}',`;
      return `  ${key} = ${value},`;
    })
    .join('\n');

  return `'use client';

import React from 'react';

interface ${name}Props {
${propsInterface || '  children?: React.ReactNode;'}
}

export function ${name}({
${defaultProps || '  children,'}
}: ${name}Props) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      {/* ${type} component: ${name} */}
      <p className="text-gray-600">${name} Component</p>
      {/* Add your component implementation here */}
    </div>
  );
}

export default ${name};
`;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get component by ID from analysis
 */
export function getComponentById(
  analysis: ScreenshotAnalysis,
  componentId: string
): IdentifiedComponent | undefined {
  return analysis.components.find((c) => c.id === componentId);
}

/**
 * Get children of a component
 */
export function getComponentChildren(
  analysis: ScreenshotAnalysis,
  componentId: string
): IdentifiedComponent[] {
  return analysis.components.filter((c) => c.parentId === componentId);
}

/**
 * Get parent of a component
 */
export function getComponentParent(
  analysis: ScreenshotAnalysis,
  componentId: string
): IdentifiedComponent | undefined {
  const component = getComponentById(analysis, componentId);
  if (!component?.parentId) return undefined;
  return getComponentById(analysis, component.parentId);
}
