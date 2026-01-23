/**
 * Token Service
 *
 * Core service for importing, managing, and transforming design tokens.
 * Supports multiple input formats: Style Dictionary, Token Studio, W3C DTCG, CSV
 */

import type {
  DesignToken,
  TokenCollection,
  TokenType,
  TokenSource,
  ImportOptions,
  StyleDictionaryFormat,
  StyleDictionaryToken,
  W3CFormat,
  W3CToken,
  TokenStudioFormat,
} from '../types/tokens';

// ============================================================================
// Format Detection
// ============================================================================

export type DetectedFormat = TokenSource | 'unknown';

/**
 * Auto-detect the format of a token file
 */
export function detectFormat(content: string, fileName?: string): DetectedFormat {
  // Check file extension first
  if (fileName) {
    if (fileName.endsWith('.csv')) return 'csv';
  }

  // Try to parse as JSON
  try {
    const json = JSON.parse(content);

    // Check for Figma Variables format FIRST (before W3C check)
    // Figma uses $value but as an object with hex/components
    if (isFigmaVariablesFormat(json)) {
      return 'figma-variables';
    }

    // W3C DTCG format has $schema or uses $value/$type
    if (json.$schema?.includes('design-tokens') || hasW3CTokens(json)) {
      return 'w3c-dtcg';
    }

    // Token Studio format has specific structure
    if (isTokenStudioFormat(json)) {
      return 'token-studio';
    }

    // Style Dictionary format uses nested objects with 'value' property
    if (isStyleDictionaryFormat(json)) {
      return 'style-dictionary';
    }

    // Generic JSON with our internal format
    if (json.tokens && Array.isArray(json.tokens)) {
      return 'manual';
    }
  } catch {
    // Not JSON, might be CSV
    if (content.includes(',') && content.includes('\n')) {
      return 'csv';
    }
  }

  return 'unknown';
}

function hasW3CTokens(obj: Record<string, unknown>, depth = 0): boolean {
  if (depth > 10) return false;

  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null) {
      const v = value as Record<string, unknown>;
      if ('$value' in v) return true;
      if (hasW3CTokens(v, depth + 1)) return true;
    }
  }
  return false;
}

/**
 * Check if this is Figma Variables REST API format
 * Figma format has $value as object with hex/components/alpha
 */
function isFigmaVariablesFormat(obj: Record<string, unknown>, depth = 0): boolean {
  if (depth > 10) return false;

  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null) {
      const v = value as Record<string, unknown>;
      // Figma format has $value as object with hex property
      if ('$value' in v && typeof v.$value === 'object' && v.$value !== null) {
        const val = v.$value as Record<string, unknown>;
        if ('hex' in val || 'components' in val) return true;
      }
      // Check for Figma extensions
      if ('$extensions' in v) {
        const ext = v.$extensions as Record<string, unknown>;
        if ('com.figma.variableId' in ext) return true;
      }
      if (isFigmaVariablesFormat(v, depth + 1)) return true;
    }
  }
  return false;
}

function isTokenStudioFormat(obj: Record<string, unknown>): boolean {
  // Token Studio exports have a specific structure with type at leaf level
  const keys = Object.keys(obj);
  // Check for common Token Studio top-level keys
  return keys.some(
    key =>
      ['global', 'light', 'dark', 'core', 'semantic'].includes(key.toLowerCase()) ||
      (typeof obj[key] === 'object' && obj[key] !== null && 'type' in (obj[key] as object))
  );
}

function isStyleDictionaryFormat(obj: Record<string, unknown>, depth = 0): boolean {
  if (depth > 10) return false;

  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null) {
      const v = value as Record<string, unknown>;
      if ('value' in v && !('$value' in v)) return true;
      if (isStyleDictionaryFormat(v, depth + 1)) return true;
    }
  }
  return false;
}

// ============================================================================
// Import Parsers
// ============================================================================

/**
 * Parse Style Dictionary format into normalized tokens
 */
export function parseStyleDictionary(
  json: StyleDictionaryFormat,
  prefix = ''
): DesignToken[] {
  const tokens: DesignToken[] = [];

  function traverse(obj: StyleDictionaryFormat | StyleDictionaryToken, path: string) {
    // Check if this is a token (has 'value' property)
    if ('value' in obj && typeof obj.value !== 'object') {
      const token = obj as StyleDictionaryToken;
      const name = path.replace(/^\./, '');

      tokens.push({
        name,
        value: token.value,
        type: inferTokenType(name, token.value, token.type),
        category: extractCategory(name),
        description: token.description || token.comment,
        originalValue: token.value,
      });
      return;
    }

    // Otherwise, traverse deeper
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        traverse(value as StyleDictionaryFormat, path ? `${path}/${key}` : key);
      }
    }
  }

  traverse(json, prefix);
  return tokens;
}

/**
 * Parse W3C Design Token Community Group format
 */
export function parseW3CDTCG(json: W3CFormat, prefix = ''): DesignToken[] {
  const tokens: DesignToken[] = [];

  function traverse(obj: W3CFormat | W3CToken, path: string) {
    // Skip schema property
    if (path === '$schema') return;

    // Check if this is a token (has '$value' property)
    if ('$value' in obj) {
      const token = obj as W3CToken;
      const name = path.replace(/^\./, '');

      tokens.push({
        name,
        value: token.$value,
        type: mapW3CType(token.$type) || inferTokenType(name, token.$value),
        category: extractCategory(name),
        description: token.$description,
        $extensions: token.$extensions,
        originalValue: token.$value,
      });
      return;
    }

    // Otherwise, traverse deeper
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$')) continue; // Skip meta properties
      if (typeof value === 'object' && value !== null) {
        traverse(value as W3CFormat, path ? `${path}/${key}` : key);
      }
    }
  }

  traverse(json, prefix);
  return tokens;
}

/**
 * Parse Token Studio format
 */
export function parseTokenStudio(json: TokenStudioFormat, prefix = ''): DesignToken[] {
  const tokens: DesignToken[] = [];

  function traverse(obj: TokenStudioFormat, path: string) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        const fullPath = path ? `${path}/${key}` : key;

        // Check if this is a token (has 'value' and 'type')
        if ('value' in value && 'type' in value) {
          const tokenValue = value as { value: string | number; type: string; description?: string };

          // Handle references (values starting with '{')
          let resolvedValue = tokenValue.value;
          let reference: string | undefined;

          if (typeof resolvedValue === 'string' && resolvedValue.startsWith('{')) {
            reference = resolvedValue.slice(1, -1).replace(/\./g, '/');
          }

          tokens.push({
            name: fullPath,
            value: resolvedValue,
            type: mapTokenStudioType(tokenValue.type),
            category: extractCategory(fullPath),
            description: tokenValue.description,
            $reference: reference,
            originalValue: tokenValue.value,
          });
        } else {
          // Nested object, traverse deeper
          traverse(value as TokenStudioFormat, fullPath);
        }
      }
    }
  }

  traverse(json, prefix);
  return tokens;
}

/**
 * Parse CSV format
 * Expected columns: name, value, type (optional), category (optional), description (optional)
 */
export function parseCSV(content: string): DesignToken[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const nameIdx = header.indexOf('name');
  const valueIdx = header.indexOf('value');
  const typeIdx = header.indexOf('type');
  const categoryIdx = header.indexOf('category');
  const descriptionIdx = header.indexOf('description');

  if (nameIdx === -1 || valueIdx === -1) {
    throw new Error('CSV must have "name" and "value" columns');
  }

  const tokens: DesignToken[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 2) continue;

    const name = values[nameIdx]?.trim();
    const value = values[valueIdx]?.trim();

    if (!name || !value) continue;

    // Try to parse numeric values
    const parsedValue = /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;

    tokens.push({
      name,
      value: parsedValue,
      type:
        typeIdx !== -1 && values[typeIdx]
          ? (values[typeIdx].trim() as TokenType)
          : inferTokenType(name, parsedValue),
      category: categoryIdx !== -1 ? values[categoryIdx]?.trim() : extractCategory(name),
      description: descriptionIdx !== -1 ? values[descriptionIdx]?.trim() : undefined,
      originalValue: parsedValue,
    });
  }

  return tokens;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);

  return values;
}

// ============================================================================
// Figma Variables Format Parser
// ============================================================================

/**
 * Figma Variables API format interfaces
 */
interface FigmaColorValue {
  colorSpace?: string;
  components?: number[];
  alpha?: number;
  hex?: string;
}

interface FigmaVariable {
  $type?: string;
  $value: FigmaColorValue | number | string;
  $description?: string;
  $extensions?: {
    'com.figma.variableId'?: string;
    'com.figma.scopes'?: string[];
    'com.figma.isOverride'?: boolean;
    [key: string]: unknown;
  };
}

interface FigmaVariablesFormat {
  [key: string]: FigmaVariable | FigmaVariablesFormat;
}

/**
 * Sanitize token names - convert spaces to hyphens, handle special characters
 */
function sanitizeTokenName(name: string): string {
  return name
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/[^a-zA-Z0-9\-\/]/g, '') // Remove special chars except - and /
    .replace(/--+/g, '-')          // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')         // Remove leading/trailing hyphens
    .toLowerCase();
}

/**
 * Convert Figma color value to CSS color string
 */
function figmaColorToCSS(value: FigmaColorValue): string {
  // If hex is provided, use it
  if (value.hex) {
    const alpha = value.alpha ?? 1;
    if (alpha < 1) {
      // Convert hex + alpha to rgba
      const hex = value.hex.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
    }
    return value.hex;
  }

  // If components are provided, convert to rgb/rgba
  if (value.components && value.components.length >= 3) {
    const [r, g, b] = value.components.map(c => Math.round(c * 255));
    const alpha = value.alpha ?? 1;
    if (alpha < 1) {
      return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  }

  return '#000000'; // Fallback
}

/**
 * Parse Figma Variables REST API format
 * This handles the export format from Figma's Variables API where:
 * - Token names can have spaces
 * - $value is an object with hex/components/alpha for colors
 * - $extensions contains Figma-specific metadata
 */
export function parseFigmaVariables(
  json: FigmaVariablesFormat,
  prefix = ''
): DesignToken[] {
  const tokens: DesignToken[] = [];

  function traverse(obj: FigmaVariablesFormat, path: string) {
    for (const [key, value] of Object.entries(obj)) {
      // Skip meta properties
      if (key.startsWith('$')) continue;

      const rawPath = path ? `${path}/${key}` : key;

      if (typeof value === 'object' && value !== null) {
        // Check if this is a token (has $value property)
        if ('$value' in value) {
          const variable = value as FigmaVariable;
          const sanitizedName = sanitizeTokenName(rawPath);

          let tokenValue: string | number;
          let tokenType: TokenType = 'other';

          // Handle the $value based on $type
          const figmaType = variable.$type?.toLowerCase();

          if (figmaType === 'color' && typeof variable.$value === 'object') {
            // Color value - convert to CSS
            tokenValue = figmaColorToCSS(variable.$value as FigmaColorValue);
            tokenType = 'color';
          } else if (figmaType === 'number' && typeof variable.$value === 'number') {
            tokenValue = variable.$value;
            tokenType = inferTokenType(sanitizedName, variable.$value);
          } else if (typeof variable.$value === 'string') {
            tokenValue = variable.$value;
            tokenType = inferTokenType(sanitizedName, variable.$value);
          } else if (typeof variable.$value === 'number') {
            tokenValue = variable.$value;
            tokenType = inferTokenType(sanitizedName, variable.$value);
          } else {
            // Unknown format, try to stringify
            tokenValue = JSON.stringify(variable.$value);
          }

          tokens.push({
            name: sanitizedName,
            value: tokenValue,
            type: tokenType,
            category: extractCategory(sanitizedName),
            description: variable.$description,
            $extensions: variable.$extensions,
            originalValue: variable.$value as string | number,
          });
        } else {
          // Nested object, traverse deeper
          traverse(value as FigmaVariablesFormat, rawPath);
        }
      }
    }
  }

  traverse(json, prefix);
  return tokens;
}

// ============================================================================
// Main Import Function
// ============================================================================

/**
 * Import tokens from various formats
 */
export function importTokens(
  content: string,
  options: ImportOptions & { fileName?: string }
): TokenCollection {
  const format = detectFormat(content, options.fileName);

  let tokens: DesignToken[] = [];
  let detectedName = 'Imported Tokens';

  switch (format) {
    case 'figma-variables': {
      const json = JSON.parse(content) as FigmaVariablesFormat;
      tokens = parseFigmaVariables(json);
      detectedName = options.fileName?.replace(/\.(json|tokens\.json)$/i, '') || 'Figma Variables';
      break;
    }

    case 'style-dictionary': {
      const json = JSON.parse(content) as StyleDictionaryFormat;
      tokens = parseStyleDictionary(json);
      break;
    }

    case 'w3c-dtcg': {
      const json = JSON.parse(content) as W3CFormat;
      tokens = parseW3CDTCG(json);
      break;
    }

    case 'token-studio': {
      const json = JSON.parse(content) as TokenStudioFormat;
      tokens = parseTokenStudio(json);
      break;
    }

    case 'csv': {
      tokens = parseCSV(content);
      break;
    }

    case 'manual': {
      const json = JSON.parse(content);
      if (json.tokens && Array.isArray(json.tokens)) {
        tokens = json.tokens;
        detectedName = json.name || detectedName;
      }
      break;
    }

    default:
      throw new Error(`Unknown token format. Please use Style Dictionary, Token Studio, W3C DTCG, or CSV format.`);
  }

  return {
    name: options.collectionName || detectedName,
    version: '1.0.0',
    tokens,
    metadata: {
      source: format,
      importedAt: new Date().toISOString(),
      fileName: options.fileName,
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Infer token type from name and value
 */
function inferTokenType(name: string, value: string | number, hint?: string): TokenType {
  const nameLower = name.toLowerCase();

  // Use hint if provided
  if (hint) {
    const hintLower = hint.toLowerCase();
    if (hintLower.includes('color')) return 'color';
    if (hintLower.includes('spacing') || hintLower.includes('space')) return 'spacing';
    if (hintLower.includes('size') && hintLower.includes('font')) return 'fontSize';
    if (hintLower.includes('font') && hintLower.includes('family')) return 'fontFamily';
    if (hintLower.includes('weight')) return 'fontWeight';
    if (hintLower.includes('line') && hintLower.includes('height')) return 'lineHeight';
    if (hintLower.includes('letter') && hintLower.includes('spacing')) return 'letterSpacing';
    if (hintLower.includes('radius') || hintLower.includes('border-radius')) return 'borderRadius';
    if (hintLower.includes('shadow') || hintLower.includes('elevation')) return 'shadow';
    if (hintLower.includes('opacity')) return 'opacity';
    if (hintLower.includes('duration') || hintLower.includes('time')) return 'duration';
  }

  // Infer from name
  if (nameLower.includes('color') || nameLower.includes('fill') || nameLower.includes('stroke'))
    return 'color';
  if (nameLower.includes('spacing') || nameLower.includes('gap') || nameLower.includes('margin') || nameLower.includes('padding'))
    return 'spacing';
  if (nameLower.includes('font-size') || nameLower.includes('fontsize') || nameLower.includes('text-size'))
    return 'fontSize';
  if (nameLower.includes('font-family') || nameLower.includes('fontfamily') || nameLower.includes('typeface'))
    return 'fontFamily';
  if (nameLower.includes('font-weight') || nameLower.includes('fontweight') || nameLower.includes('weight'))
    return 'fontWeight';
  if (nameLower.includes('line-height') || nameLower.includes('lineheight'))
    return 'lineHeight';
  if (nameLower.includes('letter-spacing') || nameLower.includes('letterspacing'))
    return 'letterSpacing';
  if (nameLower.includes('radius') || nameLower.includes('corner'))
    return 'borderRadius';
  if (nameLower.includes('border-width') || nameLower.includes('borderwidth') || nameLower.includes('stroke-width'))
    return 'borderWidth';
  if (nameLower.includes('shadow') || nameLower.includes('elevation'))
    return 'shadow';
  if (nameLower.includes('opacity') || nameLower.includes('alpha'))
    return 'opacity';
  if (nameLower.includes('duration') || nameLower.includes('delay'))
    return 'duration';

  // Infer from value
  if (typeof value === 'string') {
    if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl'))
      return 'color';
    if (value.endsWith('px') || value.endsWith('rem') || value.endsWith('em'))
      return 'dimension';
    if (value.endsWith('ms') || value.endsWith('s'))
      return 'duration';
  }

  return 'other';
}

/**
 * Map W3C DTCG type to our internal type
 */
function mapW3CType(type?: string): TokenType | undefined {
  if (!type) return undefined;

  const typeMap: Record<string, TokenType> = {
    color: 'color',
    dimension: 'spacing',
    fontFamily: 'fontFamily',
    fontWeight: 'fontWeight',
    duration: 'duration',
    cubicBezier: 'cubicBezier',
    shadow: 'shadow',
  };

  return typeMap[type];
}

/**
 * Map Token Studio type to our internal type
 */
function mapTokenStudioType(type: string): TokenType {
  const typeMap: Record<string, TokenType> = {
    color: 'color',
    spacing: 'spacing',
    sizing: 'dimension',
    borderRadius: 'borderRadius',
    borderWidth: 'borderWidth',
    fontFamilies: 'fontFamily',
    fontWeights: 'fontWeight',
    fontSizes: 'fontSize',
    lineHeights: 'lineHeight',
    letterSpacing: 'letterSpacing',
    paragraphSpacing: 'spacing',
    boxShadow: 'shadow',
    opacity: 'opacity',
  };

  return typeMap[type.toLowerCase()] || 'other';
}

/**
 * Extract category from token name
 */
function extractCategory(name: string): string | undefined {
  const parts = name.split('/');
  if (parts.length > 1) {
    return parts[0];
  }
  return undefined;
}

// ============================================================================
// Token Collection Utilities
// ============================================================================

/**
 * Merge two token collections
 */
export function mergeCollections(
  existing: TokenCollection,
  incoming: TokenCollection
): TokenCollection {
  const existingMap = new Map(existing.tokens.map(t => [t.name, t]));

  // Add or update tokens from incoming
  for (const token of incoming.tokens) {
    existingMap.set(token.name, token);
  }

  return {
    name: existing.name,
    version: existing.version,
    tokens: Array.from(existingMap.values()),
    metadata: {
      source: 'manual',
      importedAt: new Date().toISOString(),
    },
  };
}

/**
 * Filter tokens by type
 */
export function filterTokensByType(
  collection: TokenCollection,
  types: TokenType[]
): DesignToken[] {
  return collection.tokens.filter(t => types.includes(t.type));
}

/**
 * Group tokens by category
 */
export function groupTokensByCategory(
  tokens: DesignToken[]
): Record<string, DesignToken[]> {
  const groups: Record<string, DesignToken[]> = {};

  for (const token of tokens) {
    const category = token.category || 'uncategorized';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(token);
  }

  return groups;
}

/**
 * Group tokens by type
 */
export function groupTokensByType(
  tokens: DesignToken[]
): Record<TokenType, DesignToken[]> {
  const groups: Partial<Record<TokenType, DesignToken[]>> = {};

  for (const token of tokens) {
    if (!groups[token.type]) {
      groups[token.type] = [];
    }
    groups[token.type]!.push(token);
  }

  return groups as Record<TokenType, DesignToken[]>;
}

/**
 * Get token statistics
 */
export function getTokenStats(collection: TokenCollection): {
  total: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
} {
  const byType: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  for (const token of collection.tokens) {
    byType[token.type] = (byType[token.type] || 0) + 1;
    const category = token.category || 'uncategorized';
    byCategory[category] = (byCategory[category] || 0) + 1;
  }

  return {
    total: collection.tokens.length,
    byType,
    byCategory,
  };
}
