/**
 * Screenshot Analyzer Types
 * Types for analyzing screenshots and identifying UI components
 */

import type { ExtractedProp } from './codebaseAnalyzer';

// ============================================
// Bounding Box & Position
// ============================================

/** Position and dimensions of an identified component in the screenshot */
export interface BoundingBox {
  x: number;      // Pixels from left
  y: number;      // Pixels from top
  width: number;  // Width in pixels
  height: number; // Height in pixels
}

// ============================================
// Confidence Levels
// ============================================

/** Confidence level for component identification */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/** Source of the matched component */
export type ComponentSource = 'codebase' | 'figma' | 'inferred';

// ============================================
// Component Matching
// ============================================

/** Match to an existing component in codebase or Figma */
export interface ComponentMatch {
  source: ComponentSource;
  componentId: string;              // ID in source system
  componentName: string;
  matchScore: number;               // 0-100
  matchReasons: string[];           // Why this was matched

  // For codebase matches
  codebaseComponent?: {
    filePath: string;
    props: ExtractedProp[];
    sourceCode?: string;
  };

  // For Figma matches
  figmaComponent?: {
    nodeId: string;
    fileKey: string;
    properties: Record<string, {
      name: string;
      type: string;
      value: string | boolean;
      options?: string[];
    }>;
    previewUrl?: string;
  };
}

// ============================================
// Identified Component
// ============================================

/** Component identified from screenshot analysis */
export interface IdentifiedComponent {
  id: string;                       // Unique ID for this identified instance
  name: string;                     // Component name (e.g., "Button", "Card")
  type: string;                     // Component type (e.g., "button", "input", "card")
  boundingBox: BoundingBox;         // Position in screenshot
  confidence: number;               // 0-100 confidence score
  confidenceLevel: ConfidenceLevel; // Bucketed confidence

  // Inferred properties from visual analysis
  inferredProps: Record<string, string | boolean | number>;

  // Parent-child relationships
  parentId: string | null;
  childrenIds: string[];
  depth: number;                    // Nesting depth in tree

  // Match information
  matches: ComponentMatch[];        // Matched components from codebase/Figma
  bestMatch: ComponentMatch | null; // Highest confidence match

  // Visual context
  visualDescription?: string;       // AI description of appearance
}

// ============================================
// Analysis Result
// ============================================

/** Statistics from screenshot analysis */
export interface AnalysisStats {
  totalIdentified: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  matchedToCodebase: number;
  matchedToFigma: number;
  unmatchedCount: number;
}

/** Full analysis result from screenshot */
export interface ScreenshotAnalysis {
  id: string;
  fileName: string;
  uploadedAt: string;
  imageWidth: number;
  imageHeight: number;
  imageDataUrl: string;             // Base64 for display

  // Identified components
  components: IdentifiedComponent[];
  rootComponents: string[];         // IDs of top-level components

  // Analysis metadata
  analysisModel: string;            // e.g., "claude-sonnet-4-20250514"
  processingTimeMs: number;

  // Summary stats
  stats: AnalysisStats;
}

// ============================================
// Analysis Progress
// ============================================

/** Analysis stage for progress tracking */
export type ScreenshotAnalysisStage =
  | 'idle'
  | 'uploading'
  | 'analyzing'        // Claude Vision processing
  | 'matching'         // Cross-referencing with codebase/Figma
  | 'complete'
  | 'error';

/** Progress update during analysis */
export interface AnalysisProgress {
  stage: ScreenshotAnalysisStage;
  progress: number;     // 0-100
  message?: string;
}

// ============================================
// Preview Configuration
// ============================================

/** Live preview configuration for Sandpack */
export interface PreviewConfig {
  componentId: string;
  componentName: string;
  props: Record<string, unknown>;
  code: string;
  dependencies?: Record<string, string>;
}

// ============================================
// API Types
// ============================================

/** Request to analyze a screenshot */
export interface AnalyzeScreenshotRequest {
  image: string;                    // Base64 encoded image
  codebaseComponents?: Array<{
    name: string;
    filePath: string;
    type: string;
    props: ExtractedProp[];
  }>;
  figmaComponents?: Record<string, {
    name: string;
    nodeId: string;
    properties: Record<string, unknown>;
  }>;
}

/** Response from screenshot analysis */
export interface AnalyzeScreenshotResponse {
  success: boolean;
  analysis?: ScreenshotAnalysis;
  error?: string;
}

// ============================================
// Tree Node for UI Display
// ============================================

/** Tree node for hierarchical component display */
export interface ComponentTreeNode {
  id: string;
  name: string;
  type: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  hasMatch: boolean;
  matchSource?: ComponentSource;
  children: ComponentTreeNode[];
  depth: number;
}
