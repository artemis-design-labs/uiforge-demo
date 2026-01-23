/**
 * Token Mapping Service
 *
 * Maps raw Figma values (hex codes, numbers) to semantic design token names.
 * Configure your tokens in /src/config/tokens.json
 */

import tokensConfig from '../config/tokens.json';

export interface TokenMatch {
  name: string;
  category: string;
  rawValue: string;
}

interface TokenEntry {
  name: string;
  category: string;
}

interface TokensConfig {
  colors: Record<string, TokenEntry>;
  spacing: Record<string, TokenEntry>;
  borderRadius: Record<string, TokenEntry>;
  typography: Record<string, TokenEntry>;
  fontSizes: Record<string, TokenEntry>;
  elevation: Record<string, TokenEntry>;
}

// Type assertion for the imported config
const tokens = tokensConfig as TokensConfig;

/**
 * Normalize a hex color for comparison (uppercase, 6 digits)
 */
function normalizeHex(hex: string): string {
  let normalized = hex.toUpperCase().replace('#', '');

  // Convert 3-digit hex to 6-digit
  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map(c => c + c)
      .join('');
  }

  return '#' + normalized;
}

/**
 * Look up a color token by hex value
 */
export function getColorToken(hex: string): TokenMatch | null {
  const normalized = normalizeHex(hex);
  const entry = tokens.colors[normalized];

  if (entry) {
    return {
      name: entry.name,
      category: entry.category,
      rawValue: normalized,
    };
  }

  return null;
}

/**
 * Look up a spacing token by numeric value
 */
export function getSpacingToken(value: number): TokenMatch | null {
  const key = String(value);
  const entry = tokens.spacing[key];

  if (entry) {
    return {
      name: entry.name,
      category: entry.category,
      rawValue: `${value}px`,
    };
  }

  return null;
}

/**
 * Look up a border radius token by numeric value
 */
export function getBorderRadiusToken(value: number): TokenMatch | null {
  const key = String(value);
  const entry = tokens.borderRadius[key];

  if (entry) {
    return {
      name: entry.name,
      category: entry.category,
      rawValue: `${value}px`,
    };
  }

  return null;
}

/**
 * Look up a typography/font-family token
 */
export function getTypographyToken(fontFamily: string): TokenMatch | null {
  const entry = tokens.typography[fontFamily];

  if (entry) {
    return {
      name: entry.name,
      category: entry.category,
      rawValue: fontFamily,
    };
  }

  return null;
}

/**
 * Look up a font size token by numeric value
 */
export function getFontSizeToken(value: number): TokenMatch | null {
  const key = String(value);
  const entry = tokens.fontSizes[key];

  if (entry) {
    return {
      name: entry.name,
      category: entry.category,
      rawValue: `${value}px`,
    };
  }

  return null;
}

/**
 * Look up an elevation/shadow token by shadow string
 * Note: Shadow strings need to match exactly as defined in tokens.json
 */
export function getElevationToken(shadowValue: string): TokenMatch | null {
  // Try to find a matching shadow pattern
  for (const [pattern, entry] of Object.entries(tokens.elevation)) {
    if (shadowValue.includes(pattern)) {
      return {
        name: entry.name,
        category: entry.category,
        rawValue: shadowValue,
      };
    }
  }

  return null;
}

/**
 * Get all defined color tokens
 */
export function getAllColorTokens(): Array<{ hex: string; name: string; category: string }> {
  return Object.entries(tokens.colors).map(([hex, entry]) => ({
    hex,
    name: entry.name,
    category: entry.category,
  }));
}

/**
 * Get all defined spacing tokens
 */
export function getAllSpacingTokens(): Array<{ value: number; name: string; category: string }> {
  return Object.entries(tokens.spacing).map(([value, entry]) => ({
    value: Number(value),
    name: entry.name,
    category: entry.category,
  }));
}

/**
 * Check if tokens are configured
 */
export function hasConfiguredTokens(): boolean {
  return Object.keys(tokens.colors).length > 0 ||
         Object.keys(tokens.spacing).length > 0 ||
         Object.keys(tokens.borderRadius).length > 0;
}
