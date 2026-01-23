/**
 * Token Validator
 *
 * Validates design tokens for:
 * - Naming conventions
 * - WCAG accessibility (color contrast)
 * - Completeness (missing semantic layers)
 * - Type checking (valid formats)
 */

import type {
  DesignToken,
  TokenCollection,
  ValidationResult,
  ValidationIssue,
  ValidationSeverity,
  ContrastResult,
} from '../types/tokens';

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate a token collection
 */
export function validateTokens(collection: TokenCollection): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const info: ValidationIssue[] = [];

  // Run all validation rules
  errors.push(...validateNaming(collection.tokens));
  warnings.push(...validateColorFormats(collection.tokens));
  warnings.push(...validateNumericValues(collection.tokens));
  info.push(...suggestSemanticLayers(collection.tokens));

  // WCAG contrast validation for color tokens
  const colorTokens = collection.tokens.filter(t => t.type === 'color');
  if (colorTokens.length > 1) {
    const contrastIssues = validateColorContrast(colorTokens);
    warnings.push(...contrastIssues);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info,
    tokenCount: collection.tokens.length,
  };
}

// ============================================================================
// Naming Validation
// ============================================================================

/**
 * Validate token naming conventions
 */
function validateNaming(tokens: DesignToken[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const names = new Set<string>();

  for (const token of tokens) {
    // Check for duplicate names
    if (names.has(token.name)) {
      issues.push({
        severity: 'error',
        code: 'DUPLICATE_NAME',
        message: `Duplicate token name: "${token.name}"`,
        tokenNames: [token.name],
        suggestion: 'Each token must have a unique name',
      });
    }
    names.add(token.name);

    // Check for empty names
    if (!token.name || token.name.trim() === '') {
      issues.push({
        severity: 'error',
        code: 'EMPTY_NAME',
        message: 'Token has empty name',
        tokenNames: [token.name],
        suggestion: 'Provide a descriptive name for the token',
      });
      continue;
    }

    // Check for spaces in names (should use / or -)
    if (token.name.includes(' ')) {
      issues.push({
        severity: 'error',
        code: 'SPACE_IN_NAME',
        message: `Token name contains spaces: "${token.name}"`,
        tokenNames: [token.name],
        suggestion: 'Use "/" or "-" instead of spaces (e.g., "color/primary" or "color-primary")',
      });
    }

    // Check for consistent casing
    const hasUpperCase = /[A-Z]/.test(token.name);
    const hasKebabCase = token.name.includes('-');

    if (hasUpperCase && hasKebabCase) {
      issues.push({
        severity: 'warning',
        code: 'MIXED_CASING',
        message: `Token name has mixed casing: "${token.name}"`,
        tokenNames: [token.name],
        suggestion: 'Use consistent casing: either kebab-case or camelCase',
      });
    }
  }

  // Check for naming consistency across tokens
  const namingPatterns = analyzeNamingPatterns(tokens);
  if (namingPatterns.inconsistencies.length > 0) {
    issues.push({
      severity: 'warning',
      code: 'INCONSISTENT_NAMING',
      message: `Inconsistent naming patterns detected`,
      tokenNames: namingPatterns.inconsistencies,
      suggestion: `Most tokens use ${namingPatterns.dominantPattern}. Consider standardizing.`,
    });
  }

  return issues;
}

interface NamingAnalysis {
  dominantPattern: string;
  inconsistencies: string[];
}

function analyzeNamingPatterns(tokens: DesignToken[]): NamingAnalysis {
  const patterns: Record<string, number> = {
    'slash-separated': 0,
    'kebab-case': 0,
    'camelCase': 0,
    'dot-separated': 0,
  };

  const tokenPatterns: Record<string, string> = {};

  for (const token of tokens) {
    let pattern = 'other';

    if (token.name.includes('/')) {
      pattern = 'slash-separated';
    } else if (token.name.includes('.')) {
      pattern = 'dot-separated';
    } else if (token.name.includes('-')) {
      pattern = 'kebab-case';
    } else if (/[a-z][A-Z]/.test(token.name)) {
      pattern = 'camelCase';
    }

    patterns[pattern] = (patterns[pattern] || 0) + 1;
    tokenPatterns[token.name] = pattern;
  }

  // Find dominant pattern
  let maxCount = 0;
  let dominantPattern = 'slash-separated';

  for (const [pattern, count] of Object.entries(patterns)) {
    if (count > maxCount) {
      maxCount = count;
      dominantPattern = pattern;
    }
  }

  // Find inconsistencies (tokens not using dominant pattern)
  const inconsistencies = Object.entries(tokenPatterns)
    .filter(([, pattern]) => pattern !== dominantPattern && pattern !== 'other')
    .map(([name]) => name)
    .slice(0, 5); // Limit to first 5

  return { dominantPattern, inconsistencies };
}

// ============================================================================
// Color Format Validation
// ============================================================================

/**
 * Validate color token formats
 */
function validateColorFormats(tokens: DesignToken[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const colorTokens = tokens.filter(t => t.type === 'color');

  for (const token of colorTokens) {
    const value = String(token.value);

    // Check if value is a valid color format
    if (!isValidColorFormat(value)) {
      issues.push({
        severity: 'warning',
        code: 'INVALID_COLOR_FORMAT',
        message: `Invalid color format for "${token.name}": ${value}`,
        tokenNames: [token.name],
        suggestion: 'Use hex (#RRGGBB), rgb(r, g, b), or hsl(h, s%, l%) format',
      });
    }

    // Suggest using 6-digit hex instead of 3-digit
    if (/^#[0-9A-Fa-f]{3}$/.test(value)) {
      issues.push({
        severity: 'info',
        code: 'SHORT_HEX',
        message: `Consider using 6-digit hex for "${token.name}"`,
        tokenNames: [token.name],
        suggestion: 'Use #RRGGBB instead of #RGB for better compatibility',
      });
    }
  }

  return issues;
}

function isValidColorFormat(value: string): boolean {
  // Hex format (3, 6, or 8 digits)
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value)) {
    return true;
  }

  // RGB/RGBA format (handles various spacing and decimal alpha values)
  // Examples: rgba(0, 0, 0, 0.87), rgb(255, 255, 255), rgba(128, 128, 128, 1.00)
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/i.test(value)) {
    return true;
  }

  // HSL/HSLA format
  if (/^hsla?\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*(,\s*[\d.]+\s*)?\)$/i.test(value)) {
    return true;
  }

  // Named colors (basic check)
  const namedColors = [
    'transparent', 'black', 'white', 'red', 'green', 'blue', 'yellow',
    'cyan', 'magenta', 'gray', 'grey', 'orange', 'purple', 'pink',
    'currentcolor', 'inherit',
  ];
  if (namedColors.includes(value.toLowerCase())) {
    return true;
  }

  // Token reference
  if (value.startsWith('{') && value.endsWith('}')) {
    return true;
  }

  return false;
}

// ============================================================================
// Numeric Value Validation
// ============================================================================

/**
 * Validate numeric token values
 */
function validateNumericValues(tokens: DesignToken[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const numericTypes = ['spacing', 'fontSize', 'borderRadius', 'borderWidth', 'lineHeight', 'opacity'];

  for (const token of tokens) {
    if (!numericTypes.includes(token.type)) continue;

    const value = token.value;

    // Check for negative spacing/radius
    if (['spacing', 'borderRadius', 'fontSize'].includes(token.type)) {
      const numValue = typeof value === 'number' ? value : parseFloat(String(value));
      if (!isNaN(numValue) && numValue < 0) {
        issues.push({
          severity: 'warning',
          code: 'NEGATIVE_VALUE',
          message: `Negative value for "${token.name}": ${value}`,
          tokenNames: [token.name],
          suggestion: `${token.type} values should typically be positive`,
        });
      }
    }

    // Check opacity range
    if (token.type === 'opacity') {
      const numValue = typeof value === 'number' ? value : parseFloat(String(value));
      if (!isNaN(numValue) && (numValue < 0 || numValue > 1)) {
        issues.push({
          severity: 'warning',
          code: 'OPACITY_OUT_OF_RANGE',
          message: `Opacity out of range for "${token.name}": ${value}`,
          tokenNames: [token.name],
          suggestion: 'Opacity should be between 0 and 1',
        });
      }
    }
  }

  return issues;
}

// ============================================================================
// Semantic Layer Suggestions
// ============================================================================

/**
 * Suggest missing semantic layers
 */
function suggestSemanticLayers(tokens: DesignToken[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const colorTokens = tokens.filter(t => t.type === 'color');

  // Check for primitive colors without semantic aliases
  const hasSemanticColors = colorTokens.some(t =>
    t.name.toLowerCase().includes('primary') ||
    t.name.toLowerCase().includes('secondary') ||
    t.name.toLowerCase().includes('error') ||
    t.name.toLowerCase().includes('success') ||
    t.name.toLowerCase().includes('warning')
  );

  const hasPrimitiveColors = colorTokens.some(t =>
    t.name.toLowerCase().includes('blue') ||
    t.name.toLowerCase().includes('red') ||
    t.name.toLowerCase().includes('green') ||
    /\d{2,3}$/.test(t.name) // Ends with number like 500
  );

  if (hasPrimitiveColors && !hasSemanticColors) {
    issues.push({
      severity: 'info',
      code: 'MISSING_SEMANTIC_COLORS',
      message: 'Consider adding semantic color tokens',
      suggestion:
        'Add tokens like "primary", "secondary", "error", "success" that reference your primitive colors',
    });
  }

  // Check for spacing scale completeness
  const spacingTokens = tokens.filter(t => t.type === 'spacing');
  if (spacingTokens.length > 0 && spacingTokens.length < 5) {
    issues.push({
      severity: 'info',
      code: 'INCOMPLETE_SPACING_SCALE',
      message: `Only ${spacingTokens.length} spacing tokens defined`,
      suggestion:
        'Consider a more complete spacing scale (xs, sm, md, lg, xl, 2xl, etc.)',
    });
  }

  return issues;
}

// ============================================================================
// WCAG Color Contrast Validation
// ============================================================================

/**
 * Validate color contrast for WCAG compliance
 */
function validateColorContrast(colorTokens: DesignToken[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Find likely text/background pairs
  const textColors = colorTokens.filter(
    t =>
      t.name.toLowerCase().includes('text') ||
      t.name.toLowerCase().includes('foreground') ||
      t.name.toLowerCase().includes('on-')
  );

  const bgColors = colorTokens.filter(
    t =>
      t.name.toLowerCase().includes('background') ||
      t.name.toLowerCase().includes('surface') ||
      t.name.toLowerCase().includes('bg')
  );

  // If we have explicit pairs, check those
  if (textColors.length > 0 && bgColors.length > 0) {
    for (const text of textColors) {
      for (const bg of bgColors) {
        const result = checkContrast(String(text.value), String(bg.value));
        if (result && !result.passesAA) {
          issues.push({
            severity: 'warning',
            code: 'LOW_CONTRAST',
            message: `Low contrast between "${text.name}" and "${bg.name}" (${result.ratio.toFixed(2)}:1)`,
            tokenNames: [text.name, bg.name],
            suggestion: `WCAG AA requires 4.5:1 for normal text. Current ratio: ${result.ratio.toFixed(2)}:1`,
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Check contrast ratio between two colors
 */
export function checkContrast(color1: string, color2: string): ContrastResult | null {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);

  if (!rgb1 || !rgb2) return null;

  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);

  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  return {
    color1,
    color2,
    ratio,
    passesAA: ratio >= 4.5,
    passesAALarge: ratio >= 3,
    passesAAA: ratio >= 7,
    passesAAALarge: ratio >= 4.5,
  };
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

function parseColor(color: string): RGB | null {
  // Hex (3, 6, or 8 digits)
  const hexMatch = color.match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map(c => c + c)
        .join('');
    }
    // For 8-digit hex, just use the first 6 (ignore alpha for luminance)
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  // RGB/RGBA - handle various formats including decimal values
  const rgbMatch = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    };
  }

  return null;
}

function relativeLuminance(rgb: RGB): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ============================================================================
// Quick Validation
// ============================================================================

/**
 * Quick validation check - returns true if collection has no errors
 */
export function isValid(collection: TokenCollection): boolean {
  const result = validateTokens(collection);
  return result.valid;
}

/**
 * Get validation summary as string
 */
export function getValidationSummary(result: ValidationResult): string {
  const parts: string[] = [];

  if (result.errors.length > 0) {
    parts.push(`${result.errors.length} error${result.errors.length > 1 ? 's' : ''}`);
  }
  if (result.warnings.length > 0) {
    parts.push(`${result.warnings.length} warning${result.warnings.length > 1 ? 's' : ''}`);
  }
  if (result.info.length > 0) {
    parts.push(`${result.info.length} suggestion${result.info.length > 1 ? 's' : ''}`);
  }

  if (parts.length === 0) {
    return 'All tokens valid';
  }

  return parts.join(', ');
}
