/**
 * Design Token Type Definitions
 *
 * These types define the internal normalized format for design tokens
 * used throughout the Token Management & Translation system.
 */

// ============================================================================
// Core Token Types
// ============================================================================

export type TokenType =
  | 'color'
  | 'spacing'
  | 'fontSize'
  | 'fontFamily'
  | 'fontWeight'
  | 'lineHeight'
  | 'letterSpacing'
  | 'borderRadius'
  | 'borderWidth'
  | 'shadow'
  | 'opacity'
  | 'duration'
  | 'cubicBezier'
  | 'dimension'
  | 'other';

export type TokenSource =
  | 'manual'
  | 'style-dictionary'
  | 'token-studio'
  | 'w3c-dtcg'
  | 'csv'
  | 'figma'
  | 'figma-variables';

export type ExportFormat =
  | 'style-dictionary'
  | 'w3c-dtcg'
  | 'css'
  | 'tailwind'
  | 'typescript';

// ============================================================================
// Design Token
// ============================================================================

export interface DesignToken {
  /** Unique identifier/path for the token (e.g., "colors/primary/500") */
  name: string;

  /** The token value - can be string (colors, fonts) or number (spacing, sizes) */
  value: string | number;

  /** The type of design token */
  type: TokenType;

  /** Optional category for grouping (e.g., "primary", "neutral", "semantic") */
  category?: string;

  /** Human-readable description of the token's purpose */
  description?: string;

  /** Reference to another token (for aliases) */
  $reference?: string;

  /** W3C DTCG extensions for additional metadata */
  $extensions?: Record<string, unknown>;

  /** Original value before any transformations */
  originalValue?: string | number;
}

// ============================================================================
// Token Collection
// ============================================================================

export interface TokenCollectionMetadata {
  /** Source format the tokens were imported from */
  source: TokenSource;

  /** ISO timestamp when tokens were imported */
  importedAt: string;

  /** Original file name if imported from file */
  fileName?: string;

  /** Any additional metadata from the source */
  extra?: Record<string, unknown>;
}

export interface TokenCollection {
  /** Name of the token collection (e.g., "My Design System") */
  name: string;

  /** Semantic version of the token collection */
  version: string;

  /** Array of all design tokens */
  tokens: DesignToken[];

  /** Import/source metadata */
  metadata?: TokenCollectionMetadata;
}

// ============================================================================
// Import/Export Configuration
// ============================================================================

export interface ImportOptions {
  /** How to handle existing tokens */
  mode: 'replace' | 'merge';

  /** Whether to validate tokens after import */
  validate?: boolean;

  /** Custom name for the collection (overrides detected name) */
  collectionName?: string;
}

export interface ExportOptions {
  /** Output formats to generate */
  formats: ExportFormat[];

  /** Token types to include in export */
  includeTypes: TokenType[];

  /** Group tokens by category in output */
  groupByCategory: boolean;

  /** Include TypeScript type definitions */
  includeTypeDefinitions: boolean;

  /** Generate documentation/comments */
  generateDocs: boolean;

  /** Custom prefix for CSS variables (default: none) */
  cssPrefix?: string;

  /** Custom namespace for TypeScript exports */
  tsNamespace?: string;
}

export interface ExportResult {
  /** Generated files with their content */
  files: GeneratedFile[];

  /** Total number of tokens exported */
  tokenCount: number;

  /** Export formats that were generated */
  formats: ExportFormat[];
}

export interface GeneratedFile {
  /** File path/name */
  path: string;

  /** File content */
  content: string;

  /** Export format this file represents */
  format: ExportFormat;
}

// ============================================================================
// Validation Types
// ============================================================================

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  /** Severity level */
  severity: ValidationSeverity;

  /** Issue code for programmatic handling */
  code: string;

  /** Human-readable message */
  message: string;

  /** Token name(s) affected */
  tokenNames?: string[];

  /** Suggested fix if applicable */
  suggestion?: string;
}

export interface ValidationResult {
  /** Overall validation passed */
  valid: boolean;

  /** Critical issues that must be fixed */
  errors: ValidationIssue[];

  /** Issues that should be addressed */
  warnings: ValidationIssue[];

  /** Informational suggestions */
  info: ValidationIssue[];

  /** Total tokens validated */
  tokenCount: number;
}

// ============================================================================
// WCAG Accessibility Types
// ============================================================================

export interface ContrastResult {
  /** The two colors being compared */
  color1: string;
  color2: string;

  /** Calculated contrast ratio (e.g., 4.5) */
  ratio: number;

  /** Passes WCAG AA for normal text (4.5:1) */
  passesAA: boolean;

  /** Passes WCAG AA for large text (3:1) */
  passesAALarge: boolean;

  /** Passes WCAG AAA for normal text (7:1) */
  passesAAA: boolean;

  /** Passes WCAG AAA for large text (4.5:1) */
  passesAAALarge: boolean;
}

// ============================================================================
// Style Dictionary Format Types
// ============================================================================

export interface StyleDictionaryToken {
  value: string | number;
  type?: string;
  description?: string;
  comment?: string;
  attributes?: Record<string, unknown>;
}

export interface StyleDictionaryFormat {
  [key: string]: StyleDictionaryToken | StyleDictionaryFormat;
}

// ============================================================================
// W3C DTCG Format Types
// ============================================================================

export interface W3CToken {
  $value: string | number;
  $type?: string;
  $description?: string;
  $extensions?: Record<string, unknown>;
}

export interface W3CFormat {
  $schema?: string;
  [key: string]: W3CToken | W3CFormat | string | undefined;
}

// ============================================================================
// Token Studio Format Types
// ============================================================================

export interface TokenStudioValue {
  value: string | number;
  type: string;
  description?: string;
}

export interface TokenStudioFormat {
  [key: string]: TokenStudioValue | TokenStudioFormat | string;
}

// ============================================================================
// Redux State Types
// ============================================================================

export interface TokenState {
  /** Current token collection */
  collection: TokenCollection | null;

  /** Validation results for current collection */
  validation: ValidationResult | null;

  /** Export configuration */
  exportConfig: ExportOptions;

  /** Loading state */
  isLoading: boolean;

  /** Error message if any */
  error: string | null;
}

export const DEFAULT_EXPORT_CONFIG: ExportOptions = {
  formats: ['typescript'],
  includeTypes: ['color', 'spacing', 'fontSize', 'fontFamily', 'borderRadius', 'shadow'],
  groupByCategory: true,
  includeTypeDefinitions: true,
  generateDocs: false,
};
