// Codebase Migration Assistant - Type Definitions

// ============================================
// Framework and Technology Types
// ============================================

export type Framework = 'react' | 'vue' | 'angular' | 'svelte' | 'unknown';

export type StylingApproach =
  | 'css-modules'
  | 'styled-components'
  | 'tailwind'
  | 'scss'
  | 'sass'
  | 'less'
  | 'emotion'
  | 'vanilla-css'
  | 'css-in-js'
  | 'unknown';

export type StateManagement =
  | 'redux'
  | 'redux-toolkit'
  | 'zustand'
  | 'mobx'
  | 'vuex'
  | 'pinia'
  | 'context'
  | 'signals'
  | 'jotai'
  | 'recoil'
  | 'none';

export type RoutingLibrary =
  | 'react-router'
  | 'vue-router'
  | 'angular-router'
  | 'next'
  | 'nuxt'
  | 'sveltekit'
  | 'tanstack-router'
  | 'none';

export type ApiPattern =
  | 'fetch'
  | 'axios'
  | 'graphql'
  | 'apollo'
  | 'urql'
  | 'trpc'
  | 'tanstack-query'
  | 'swr'
  | 'rtk-query';

// ============================================
// File System Types
// ============================================

export interface CodebaseFile {
  /** Relative path from project root */
  path: string;
  /** File name without path */
  name: string;
  /** File extension (e.g., 'tsx', 'vue', 'ts') */
  extension: string;
  /** File content as string */
  content: string;
  /** File size in bytes */
  size: number;
  /** Whether this is a directory */
  isDirectory: boolean;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  extension?: string;
}

// ============================================
// Component Extraction Types
// ============================================

export interface ExtractedProp {
  /** Property name */
  name: string;
  /** TypeScript/PropTypes type */
  type: string;
  /** Whether prop is required */
  required: boolean;
  /** Default value if specified */
  defaultValue?: string;
  /** JSDoc description if available */
  description?: string;
}

export type ComponentType = 'functional' | 'class' | 'sfc' | 'hook' | 'hoc' | 'unknown';

export interface ExtractedComponent {
  /** Component name */
  name: string;
  /** File path where component is defined */
  filePath: string;
  /** Component type */
  type: ComponentType;
  /** Extracted props */
  props: ExtractedProp[];
  /** Import statements */
  imports: string[];
  /** Export type (default, named, etc.) */
  exports: string[];
  /** Whether component has associated styles */
  hasStyles: boolean;
  /** Styling approach used */
  styleApproach?: StylingApproach;
  /** State management hooks/patterns used */
  stateUsage: string[];
  /** React hooks used (for React components) */
  hooks: string[];
  /** Child components referenced */
  childComponents: string[];
  /** Line number where component starts */
  startLine?: number;
  /** Line number where component ends */
  endLine?: number;
  /** Raw source code of the component */
  sourceCode?: string;
}

// ============================================
// Analysis Result Types
// ============================================

export interface FrameworkAnalysis {
  /** Detected framework */
  detected: Framework;
  /** Confidence score (0-100) */
  confidence: number;
  /** Framework version if detected */
  version?: string;
  /** Evidence for detection */
  evidence: string[];
  /** Meta-framework if applicable (Next.js, Nuxt, etc.) */
  metaFramework?: string;
}

export interface PatternAnalysis {
  /** Primary state management solution */
  stateManagement: StateManagement;
  /** Primary styling approach */
  styling: StylingApproach;
  /** Routing library used */
  routing: RoutingLibrary;
  /** API/data fetching patterns */
  apiPatterns: ApiPattern[];
  /** Testing frameworks detected */
  testingFrameworks: string[];
  /** Build tools detected */
  buildTools: string[];
  /** Other notable patterns */
  otherPatterns: string[];
}

export interface DependencyInfo {
  /** Package name */
  name: string;
  /** Version string */
  version: string;
  /** Whether it's a dev dependency */
  isDev: boolean;
  /** Category (ui, state, routing, etc.) */
  category?: string;
}

export interface CodebaseAnalysis {
  /** Unique ID for this analysis */
  id: string;
  /** Project name (from package.json or folder name) */
  name: string;
  /** When analysis was performed */
  analyzedAt: string;
  /** Framework detection results */
  framework: FrameworkAnalysis;
  /** Pattern detection results */
  patterns: PatternAnalysis;
  /** Extracted components */
  components: ExtractedComponent[];
  /** Total files analyzed */
  fileCount: number;
  /** Total size of analyzed files */
  totalSize: number;
  /** Entry point files (index.ts, main.ts, App.tsx, etc.) */
  entryPoints: string[];
  /** Dependencies from package.json */
  dependencies: DependencyInfo[];
  /** Project structure summary */
  structure: ProjectStructure;
  /** Any errors encountered during analysis */
  errors: AnalysisError[];
}

export interface ProjectStructure {
  /** Detected source directory (src/, app/, etc.) */
  sourceDir: string;
  /** Components directory if exists */
  componentsDir?: string;
  /** Pages/routes directory if exists */
  pagesDir?: string;
  /** Styles directory if exists */
  stylesDir?: string;
  /** Utils/helpers directory if exists */
  utilsDir?: string;
  /** API/services directory if exists */
  apiDir?: string;
  /** Store/state directory if exists */
  storeDir?: string;
  /** Config files found */
  configFiles: string[];
}

export interface AnalysisError {
  /** File path where error occurred */
  file?: string;
  /** Error message */
  message: string;
  /** Error type/category */
  type: 'parse' | 'extraction' | 'detection' | 'general';
}

// ============================================
// Analysis Stage Types
// ============================================

export type AnalysisStage =
  | 'idle'
  | 'extracting'    // Extracting files from ZIP
  | 'detecting'     // Detecting framework
  | 'analyzing'     // Analyzing components and patterns
  | 'complete'
  | 'error';

export interface AnalysisProgress {
  stage: AnalysisStage;
  progress: number;  // 0-100
  currentFile?: string;
  message?: string;
}

// ============================================
// Storage Types
// ============================================

export interface SavedAnalysis {
  id: string;
  name: string;
  framework: Framework;
  componentCount: number;
  analyzedAt: string;
  /** Compressed analysis data for localStorage */
  data: string;
}

// ============================================
// Component Matching Types (for future Phase 2)
// ============================================

export interface ComponentMatch {
  /** Source component from codebase */
  sourceComponent: ExtractedComponent;
  /** Target Figma component */
  figmaComponent: {
    nodeId: string;
    name: string;
  };
  /** Match confidence (0-100) */
  confidence: number;
  /** Reasons for match */
  matchReasons: string[];
  /** Suggested prop mappings */
  propMappings: PropMapping[];
}

export interface PropMapping {
  sourceProp: string;
  targetProp: string;
  transformRequired: boolean;
  transform?: string;
}
