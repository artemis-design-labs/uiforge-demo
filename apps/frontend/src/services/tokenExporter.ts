/**
 * Token Exporter
 *
 * Generates design token files in various output formats:
 * - Style Dictionary (JSON)
 * - W3C DTCG (JSON)
 * - CSS Custom Properties
 * - Tailwind Config
 * - TypeScript Theme
 */

import type {
  DesignToken,
  TokenCollection,
  TokenType,
  ExportFormat,
  ExportOptions,
  ExportResult,
  GeneratedFile,
} from '../types/tokens';
import { groupTokensByType, groupTokensByCategory } from './tokenService';

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Export token collection to multiple formats
 */
export function exportTokens(
  collection: TokenCollection,
  options: ExportOptions
): ExportResult {
  const files: GeneratedFile[] = [];

  // Filter tokens by included types
  const filteredTokens = collection.tokens.filter(t =>
    options.includeTypes.includes(t.type)
  );

  for (const format of options.formats) {
    const formatFiles = generateFormatFiles(filteredTokens, format, options, collection.name);
    files.push(...formatFiles);
  }

  return {
    files,
    tokenCount: filteredTokens.length,
    formats: options.formats,
  };
}

/**
 * Generate files for a specific format
 */
function generateFormatFiles(
  tokens: DesignToken[],
  format: ExportFormat,
  options: ExportOptions,
  collectionName: string
): GeneratedFile[] {
  switch (format) {
    case 'style-dictionary':
      return generateStyleDictionary(tokens, options);
    case 'w3c-dtcg':
      return generateW3CDTCG(tokens, options);
    case 'css':
      return generateCSSVariables(tokens, options);
    case 'tailwind':
      return generateTailwindConfig(tokens, options, collectionName);
    case 'typescript':
      return generateTypeScript(tokens, options, collectionName);
    default:
      return [];
  }
}

// ============================================================================
// Style Dictionary Export
// ============================================================================

function generateStyleDictionary(
  tokens: DesignToken[],
  options: ExportOptions
): GeneratedFile[] {
  const output: Record<string, unknown> = {};

  for (const token of tokens) {
    const path = token.name.split('/');
    let current = output;

    // Build nested structure
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    // Set the token value
    const leafKey = path[path.length - 1];
    const tokenObj: Record<string, unknown> = {
      value: token.value,
    };

    if (token.type && token.type !== 'other') {
      tokenObj.type = mapTypeToStyleDictionary(token.type);
    }

    if (options.generateDocs && token.description) {
      tokenObj.comment = token.description;
    }

    current[leafKey] = tokenObj;
  }

  const files: GeneratedFile[] = [
    {
      path: 'tokens.json',
      content: JSON.stringify(output, null, 2),
      format: 'style-dictionary',
    },
  ];

  // Add Style Dictionary config file
  const config = {
    source: ['tokens.json'],
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: 'build/css/',
        files: [
          {
            destination: 'variables.css',
            format: 'css/variables',
          },
        ],
      },
      js: {
        transformGroup: 'js',
        buildPath: 'build/js/',
        files: [
          {
            destination: 'tokens.js',
            format: 'javascript/es6',
          },
        ],
      },
    },
  };

  files.push({
    path: 'config.json',
    content: JSON.stringify(config, null, 2),
    format: 'style-dictionary',
  });

  return files;
}

function mapTypeToStyleDictionary(type: TokenType): string {
  const typeMap: Record<TokenType, string> = {
    color: 'color',
    spacing: 'size',
    fontSize: 'size',
    fontFamily: 'fontFamily',
    fontWeight: 'fontWeight',
    lineHeight: 'lineHeight',
    letterSpacing: 'letterSpacing',
    borderRadius: 'size',
    borderWidth: 'size',
    shadow: 'shadow',
    opacity: 'opacity',
    duration: 'time',
    cubicBezier: 'cubicBezier',
    dimension: 'size',
    other: 'other',
  };
  return typeMap[type] || 'other';
}

// ============================================================================
// W3C DTCG Export
// ============================================================================

function generateW3CDTCG(
  tokens: DesignToken[],
  options: ExportOptions
): GeneratedFile[] {
  const output: Record<string, unknown> = {
    $schema: 'https://design-tokens.github.io/community-group/format/',
  };

  for (const token of tokens) {
    const path = token.name.split('/');
    let current = output;

    // Build nested structure
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    // Set the token value with W3C DTCG format
    const leafKey = path[path.length - 1];
    const tokenObj: Record<string, unknown> = {
      $value: token.value,
    };

    if (token.type && token.type !== 'other') {
      tokenObj.$type = mapTypeToW3C(token.type);
    }

    if (options.generateDocs && token.description) {
      tokenObj.$description = token.description;
    }

    if (token.$extensions) {
      tokenObj.$extensions = token.$extensions;
    }

    current[leafKey] = tokenObj;
  }

  return [
    {
      path: 'tokens.json',
      content: JSON.stringify(output, null, 2),
      format: 'w3c-dtcg',
    },
  ];
}

function mapTypeToW3C(type: TokenType): string {
  const typeMap: Record<TokenType, string> = {
    color: 'color',
    spacing: 'dimension',
    fontSize: 'dimension',
    fontFamily: 'fontFamily',
    fontWeight: 'fontWeight',
    lineHeight: 'number',
    letterSpacing: 'dimension',
    borderRadius: 'dimension',
    borderWidth: 'dimension',
    shadow: 'shadow',
    opacity: 'number',
    duration: 'duration',
    cubicBezier: 'cubicBezier',
    dimension: 'dimension',
    other: 'string',
  };
  return typeMap[type] || 'string';
}

// ============================================================================
// CSS Custom Properties Export
// ============================================================================

function generateCSSVariables(
  tokens: DesignToken[],
  options: ExportOptions
): GeneratedFile[] {
  const prefix = options.cssPrefix ? `${options.cssPrefix}-` : '';
  const lines: string[] = [];

  // Add header comment
  if (options.generateDocs) {
    lines.push('/**');
    lines.push(' * Design Tokens - CSS Custom Properties');
    lines.push(` * Generated: ${new Date().toISOString()}`);
    lines.push(` * Total tokens: ${tokens.length}`);
    lines.push(' */');
    lines.push('');
  }

  lines.push(':root {');

  // Group by type or category for better organization
  if (options.groupByCategory) {
    const grouped = groupTokensByCategory(tokens);
    const categories = Object.keys(grouped).sort();

    for (const category of categories) {
      if (options.generateDocs) {
        lines.push(`  /* ${category} */`);
      }

      for (const token of grouped[category]) {
        const varName = tokenNameToCSSVar(token.name, prefix);
        const value = formatCSSValue(token.value, token.type);

        if (options.generateDocs && token.description) {
          lines.push(`  /* ${token.description} */`);
        }
        lines.push(`  ${varName}: ${value};`);
      }

      lines.push('');
    }
  } else {
    for (const token of tokens) {
      const varName = tokenNameToCSSVar(token.name, prefix);
      const value = formatCSSValue(token.value, token.type);
      lines.push(`  ${varName}: ${value};`);
    }
  }

  lines.push('}');

  return [
    {
      path: 'tokens.css',
      content: lines.join('\n'),
      format: 'css',
    },
  ];
}

function tokenNameToCSSVar(name: string, prefix: string): string {
  // Convert token name to CSS variable: colors/primary/500 -> --colors-primary-500
  return `--${prefix}${name.replace(/\//g, '-').replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}`;
}

function formatCSSValue(value: string | number, type: TokenType): string {
  if (typeof value === 'number') {
    // Add units based on type
    switch (type) {
      case 'spacing':
      case 'fontSize':
      case 'borderRadius':
      case 'borderWidth':
      case 'dimension':
        return `${value}px`;
      case 'lineHeight':
      case 'opacity':
        return String(value);
      case 'duration':
        return `${value}ms`;
      default:
        return String(value);
    }
  }
  return String(value);
}

// ============================================================================
// Tailwind Config Export
// ============================================================================

function generateTailwindConfig(
  tokens: DesignToken[],
  options: ExportOptions,
  collectionName: string
): GeneratedFile[] {
  const byType = groupTokensByType(tokens);

  const theme: Record<string, unknown> = {};

  // Colors
  if (byType.color?.length) {
    theme.colors = buildTailwindColorPalette(byType.color, options.groupByCategory);
  }

  // Spacing
  if (byType.spacing?.length) {
    theme.spacing = buildTailwindSpacing(byType.spacing);
  }

  // Font sizes
  if (byType.fontSize?.length) {
    theme.fontSize = buildTailwindFontSizes(byType.fontSize);
  }

  // Font families
  if (byType.fontFamily?.length) {
    theme.fontFamily = buildTailwindFontFamilies(byType.fontFamily);
  }

  // Font weights
  if (byType.fontWeight?.length) {
    theme.fontWeight = buildTailwindFontWeights(byType.fontWeight);
  }

  // Border radius
  if (byType.borderRadius?.length) {
    theme.borderRadius = buildTailwindBorderRadius(byType.borderRadius);
  }

  // Box shadows
  if (byType.shadow?.length) {
    theme.boxShadow = buildTailwindShadows(byType.shadow);
  }

  const configContent = `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: ${JSON.stringify(theme, null, 6).replace(/^/gm, '    ').trim()},
  },
};
`;

  const files: GeneratedFile[] = [
    {
      path: 'tailwind.tokens.js',
      content: configContent,
      format: 'tailwind',
    },
  ];

  // Also generate a pure JS export for manual integration
  const jsExport = `// ${collectionName} - Tailwind Theme Tokens
// Import and spread into your tailwind.config.js theme.extend

export const tokens = ${JSON.stringify(theme, null, 2)};

export default tokens;
`;

  files.push({
    path: 'tailwind.tokens.mjs',
    content: jsExport,
    format: 'tailwind',
  });

  return files;
}

function buildTailwindColorPalette(
  tokens: DesignToken[],
  groupByCategory: boolean
): Record<string, unknown> {
  const colors: Record<string, unknown> = {};

  for (const token of tokens) {
    const parts = token.name.split('/');

    if (groupByCategory && parts.length > 1) {
      // Nested structure: colors.primary.500
      let current = colors;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = token.value;
    } else {
      // Flat structure: colors['primary-500']
      const key = parts.join('-');
      colors[key] = token.value;
    }
  }

  return colors;
}

function buildTailwindSpacing(tokens: DesignToken[]): Record<string, string> {
  const spacing: Record<string, string> = {};

  for (const token of tokens) {
    const key = token.name.split('/').pop() || token.name;
    const value = typeof token.value === 'number' ? `${token.value}px` : String(token.value);
    spacing[key] = value;
  }

  return spacing;
}

function buildTailwindFontSizes(tokens: DesignToken[]): Record<string, string> {
  const sizes: Record<string, string> = {};

  for (const token of tokens) {
    const key = token.name.split('/').pop() || token.name;
    const value = typeof token.value === 'number' ? `${token.value}px` : String(token.value);
    sizes[key] = value;
  }

  return sizes;
}

function buildTailwindFontFamilies(tokens: DesignToken[]): Record<string, string[]> {
  const families: Record<string, string[]> = {};

  for (const token of tokens) {
    const key = token.name.split('/').pop() || token.name;
    const value = String(token.value);
    // Tailwind expects an array of font families
    families[key] = value.split(',').map(f => f.trim());
  }

  return families;
}

function buildTailwindFontWeights(tokens: DesignToken[]): Record<string, string | number> {
  const weights: Record<string, string | number> = {};

  for (const token of tokens) {
    const key = token.name.split('/').pop() || token.name;
    weights[key] = token.value;
  }

  return weights;
}

function buildTailwindBorderRadius(tokens: DesignToken[]): Record<string, string> {
  const radius: Record<string, string> = {};

  for (const token of tokens) {
    const key = token.name.split('/').pop() || token.name;
    const value = typeof token.value === 'number' ? `${token.value}px` : String(token.value);
    radius[key] = value;
  }

  return radius;
}

function buildTailwindShadows(tokens: DesignToken[]): Record<string, string> {
  const shadows: Record<string, string> = {};

  for (const token of tokens) {
    const key = token.name.split('/').pop() || token.name;
    shadows[key] = String(token.value);
  }

  return shadows;
}

// ============================================================================
// TypeScript Export
// ============================================================================

function generateTypeScript(
  tokens: DesignToken[],
  options: ExportOptions,
  collectionName: string
): GeneratedFile[] {
  const byType = groupTokensByType(tokens);
  const lines: string[] = [];

  // Header
  lines.push('/**');
  lines.push(` * ${collectionName} - Design Tokens`);
  lines.push(` * Generated: ${new Date().toISOString()}`);
  lines.push(' * ');
  lines.push(' * This file is auto-generated. Do not edit manually.');
  lines.push(' */');
  lines.push('');

  // Generate each token type as a const object
  const typeExports: string[] = [];

  // Colors
  if (byType.color?.length) {
    lines.push(generateTypeScriptObject('colors', byType.color, options.groupByCategory));
    typeExports.push('colors');
  }

  // Spacing
  if (byType.spacing?.length) {
    lines.push(generateTypeScriptObject('spacing', byType.spacing, options.groupByCategory, true));
    typeExports.push('spacing');
  }

  // Font sizes
  if (byType.fontSize?.length) {
    lines.push(generateTypeScriptObject('fontSize', byType.fontSize, options.groupByCategory, true));
    typeExports.push('fontSize');
  }

  // Font families
  if (byType.fontFamily?.length) {
    lines.push(generateTypeScriptObject('fontFamily', byType.fontFamily, false));
    typeExports.push('fontFamily');
  }

  // Font weights
  if (byType.fontWeight?.length) {
    lines.push(generateTypeScriptObject('fontWeight', byType.fontWeight, false));
    typeExports.push('fontWeight');
  }

  // Line heights
  if (byType.lineHeight?.length) {
    lines.push(generateTypeScriptObject('lineHeight', byType.lineHeight, false));
    typeExports.push('lineHeight');
  }

  // Border radius
  if (byType.borderRadius?.length) {
    lines.push(generateTypeScriptObject('borderRadius', byType.borderRadius, false, true));
    typeExports.push('borderRadius');
  }

  // Shadows
  if (byType.shadow?.length) {
    lines.push(generateTypeScriptObject('shadows', byType.shadow, false));
    typeExports.push('shadows');
  }

  // Generate combined theme object
  lines.push('');
  lines.push('export const theme = {');
  for (const exp of typeExports) {
    lines.push(`  ${exp},`);
  }
  lines.push('} as const;');
  lines.push('');
  lines.push('export type Theme = typeof theme;');

  // Generate type definitions if requested
  if (options.includeTypeDefinitions) {
    lines.push('');
    lines.push('// Token type helpers');

    for (const exp of typeExports) {
      const typeName = exp.charAt(0).toUpperCase() + exp.slice(1) + 'Token';
      lines.push(`export type ${typeName} = keyof typeof ${exp};`);
    }
  }

  lines.push('');

  return [
    {
      path: 'theme.ts',
      content: lines.join('\n'),
      format: 'typescript',
    },
  ];
}

function generateTypeScriptObject(
  name: string,
  tokens: DesignToken[],
  nested: boolean,
  addPxSuffix = false
): string {
  const lines: string[] = [];
  lines.push(`export const ${name} = {`);

  if (nested) {
    // Build nested structure
    const structure: Record<string, unknown> = {};

    for (const token of tokens) {
      const parts = token.name.split('/');
      let current = structure;

      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
      }

      const value = formatTypeScriptValue(token.value, addPxSuffix);
      current[parts[parts.length - 1]] = value;
    }

    // Serialize nested structure
    const serialized = serializeNestedObject(structure, 1);
    lines.push(serialized);
  } else {
    // Flat structure
    for (const token of tokens) {
      const key = sanitizeKey(token.name.split('/').pop() || token.name);
      const value = formatTypeScriptValue(token.value, addPxSuffix);
      lines.push(`  ${key}: ${value},`);
    }
  }

  lines.push('} as const;');
  lines.push('');

  return lines.join('\n');
}

function formatTypeScriptValue(value: string | number, addPxSuffix: boolean): string {
  if (typeof value === 'number') {
    if (addPxSuffix) {
      return `'${value}px'`;
    }
    return String(value);
  }
  return `'${value.replace(/'/g, "\\'")}'`;
}

function sanitizeKey(key: string): string {
  // If key contains special characters or starts with number, wrap in quotes
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
    return key;
  }
  return `'${key}'`;
}

function serializeNestedObject(obj: Record<string, unknown>, indent: number): string {
  const lines: string[] = [];
  const spaces = '  '.repeat(indent);

  for (const [key, value] of Object.entries(obj)) {
    const safeKey = sanitizeKey(key);

    if (typeof value === 'object' && value !== null) {
      lines.push(`${spaces}${safeKey}: {`);
      lines.push(serializeNestedObject(value as Record<string, unknown>, indent + 1));
      lines.push(`${spaces}},`);
    } else {
      lines.push(`${spaces}${safeKey}: ${value},`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// Preview Generation
// ============================================================================

/**
 * Generate a preview of the export for a specific format
 */
export function generatePreview(
  tokens: DesignToken[],
  format: ExportFormat,
  options: ExportOptions
): string {
  const files = generateFormatFiles(tokens, format, options, 'Preview');
  if (files.length === 0) return '';

  // Return the main file's content (first file)
  return files[0].content;
}
