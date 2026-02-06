/**
 * SVG Exporter Service
 * Converts DOM elements to SVG for Figma import
 */

import { toSvg, toPng } from 'html-to-image';

export interface ExportOptions {
  backgroundColor?: string;
  width?: number;
  height?: number;
  quality?: number;
  pixelRatio?: number;
}

const DEFAULT_OPTIONS: ExportOptions = {
  backgroundColor: '#ffffff',
  quality: 1,
  pixelRatio: 2,
};

/**
 * Export a DOM element to SVG data URL
 */
export async function exportToSvg(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<string> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    const dataUrl = await toSvg(element, {
      quality: mergedOptions.quality,
      backgroundColor: mergedOptions.backgroundColor,
      width: mergedOptions.width,
      height: mergedOptions.height,
      pixelRatio: mergedOptions.pixelRatio,
      // Filter out problematic elements
      filter: (node) => {
        // Skip script tags and hidden elements
        if (node instanceof HTMLElement) {
          const tagName = node.tagName?.toLowerCase();
          if (tagName === 'script' || tagName === 'noscript') {
            return false;
          }
        }
        return true;
      },
    });

    return dataUrl;
  } catch (error) {
    console.error('Failed to export to SVG:', error);
    throw new Error(`SVG export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export a DOM element to PNG data URL
 */
export async function exportToPng(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<string> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    const dataUrl = await toPng(element, {
      quality: mergedOptions.quality,
      backgroundColor: mergedOptions.backgroundColor,
      width: mergedOptions.width,
      height: mergedOptions.height,
      pixelRatio: mergedOptions.pixelRatio,
    });

    return dataUrl;
  } catch (error) {
    console.error('Failed to export to PNG:', error);
    throw new Error(`PNG export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download a data URL as a file
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download element as SVG file
 */
export async function downloadAsSvg(
  element: HTMLElement,
  filename: string,
  options: ExportOptions = {}
): Promise<void> {
  const dataUrl = await exportToSvg(element, options);
  downloadDataUrl(dataUrl, filename.endsWith('.svg') ? filename : `${filename}.svg`);
}

/**
 * Download element as PNG file
 */
export async function downloadAsPng(
  element: HTMLElement,
  filename: string,
  options: ExportOptions = {}
): Promise<void> {
  const dataUrl = await exportToPng(element, options);
  downloadDataUrl(dataUrl, filename.endsWith('.png') ? filename : `${filename}.png`);
}

/**
 * Convert data URL to Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/svg+xml';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * Extract component name from React code
 */
export function extractComponentName(code: string): string {
  // Try to find function component name
  const functionMatch = code.match(/(?:export\s+default\s+)?function\s+(\w+)/);
  if (functionMatch) return functionMatch[1];

  // Try to find arrow function component name
  const arrowMatch = code.match(/(?:export\s+default\s+)?const\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=])\s*=>/);
  if (arrowMatch) return arrowMatch[1];

  // Try to find class component name
  const classMatch = code.match(/class\s+(\w+)\s+extends\s+(?:React\.)?Component/);
  if (classMatch) return classMatch[1];

  return 'Component';
}
