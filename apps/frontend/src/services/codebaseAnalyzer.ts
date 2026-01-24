import type {
  CodebaseFile,
  CodebaseAnalysis,
  AnalysisProgress,
  AnalysisError,
  SavedAnalysis,
} from '../types/codebaseAnalyzer';
import { processZipFile, validateZipFile } from './zipProcessor';
import { detectFramework, extractDependencies, getProjectName } from './frameworkDetector';
import { extractComponents } from './componentExtractor';
import { analyzePatterns, detectProjectStructure } from './patternAnalyzer';

// ============================================
// Types
// ============================================

export interface AnalyzeCodebaseOptions {
  /** Callback for progress updates */
  onProgress?: (progress: AnalysisProgress) => void;
  /** Maximum file size to process in bytes */
  maxFileSize?: number;
  /** Maximum total size in bytes */
  maxTotalSize?: number;
}

export interface AnalyzeCodebaseResult {
  success: boolean;
  analysis?: CodebaseAnalysis;
  error?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generate unique ID for analysis
 */
function generateId(): string {
  return `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Find entry point files
 */
function findEntryPoints(files: CodebaseFile[]): string[] {
  const entryPointNames = [
    'index.tsx',
    'index.ts',
    'index.jsx',
    'index.js',
    'main.tsx',
    'main.ts',
    'main.jsx',
    'main.js',
    'App.tsx',
    'App.ts',
    'App.jsx',
    'App.js',
    'app.tsx',
    'app.ts',
    'app.jsx',
    'app.js',
  ];

  const entryPoints: string[] = [];

  // Look for entry points in common locations
  const searchPaths = ['src/', 'app/', 'pages/', ''];

  for (const searchPath of searchPaths) {
    for (const entryName of entryPointNames) {
      const file = files.find(
        (f) =>
          f.path === `${searchPath}${entryName}` ||
          f.path.endsWith(`/${entryName}`)
      );
      if (file && !entryPoints.includes(file.path)) {
        entryPoints.push(file.path);
      }
    }
  }

  return entryPoints.slice(0, 5); // Limit to 5 entry points
}

// ============================================
// Main Analysis Function
// ============================================

/**
 * Analyze a codebase from a ZIP file
 */
export async function analyzeCodebase(
  file: File,
  options: AnalyzeCodebaseOptions = {}
): Promise<AnalyzeCodebaseResult> {
  const { onProgress, maxFileSize, maxTotalSize } = options;
  const errors: AnalysisError[] = [];

  // Helper to report progress
  const reportProgress = (
    stage: AnalysisProgress['stage'],
    progress: number,
    message?: string,
    currentFile?: string
  ) => {
    if (onProgress) {
      onProgress({ stage, progress, message, currentFile });
    }
  };

  try {
    // ========== Stage 1: Validate ZIP ==========
    reportProgress('extracting', 0, 'Validating ZIP file...');

    const validation = validateZipFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // ========== Stage 2: Extract Files ==========
    reportProgress('extracting', 10, 'Extracting files from ZIP...');

    const extractResult = await processZipFile(file, {
      onProgress: (progress, currentFile) => {
        const adjustedProgress = 10 + Math.round(progress * 0.3); // 10-40%
        reportProgress('extracting', adjustedProgress, 'Extracting files...', currentFile);
      },
      maxFileSize,
      maxTotalSize,
    });

    const { files, totalSize, fileCount } = extractResult;

    if (files.length === 0) {
      return {
        success: false,
        error: 'No code files found in ZIP. Make sure the archive contains JavaScript, TypeScript, Vue, Svelte, or Angular files.',
      };
    }

    // Add extraction errors
    for (const err of extractResult.errors) {
      errors.push({ message: err, type: 'extraction' });
    }

    // ========== Stage 3: Detect Framework ==========
    reportProgress('detecting', 45, 'Detecting framework...');

    const frameworkAnalysis = detectFramework(files);
    const dependencies = extractDependencies(files);
    const projectName = getProjectName(files);

    reportProgress('detecting', 55, `Detected: ${frameworkAnalysis.detected}`);

    // ========== Stage 4: Extract Components ==========
    reportProgress('analyzing', 60, 'Extracting components...');

    let components: CodebaseAnalysis['components'];
    try {
      components = extractComponents(files, frameworkAnalysis.detected);
    } catch (err) {
      errors.push({
        message: `Component extraction error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: 'extraction',
      });
      components = [];
    }

    reportProgress('analyzing', 75, `Found ${components.length} components`);

    // ========== Stage 5: Analyze Patterns ==========
    reportProgress('analyzing', 80, 'Analyzing patterns...');

    const patterns = analyzePatterns(files, dependencies);
    const structure = detectProjectStructure(files);

    reportProgress('analyzing', 90, 'Finalizing analysis...');

    // ========== Stage 6: Find Entry Points ==========
    const entryPoints = findEntryPoints(files);

    // ========== Stage 7: Build Result ==========
    reportProgress('complete', 100, 'Analysis complete');

    const analysis: CodebaseAnalysis = {
      id: generateId(),
      name: projectName,
      analyzedAt: new Date().toISOString(),
      framework: frameworkAnalysis,
      patterns,
      components,
      fileCount,
      totalSize,
      entryPoints,
      dependencies,
      structure,
      errors,
    };

    return {
      success: true,
      analysis,
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'An unknown error occurred';

    reportProgress('error', 0, errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ============================================
// localStorage Persistence
// ============================================

const STORAGE_KEY = 'uiforge_codebase_analyses';

/**
 * Save analysis to localStorage
 */
export function saveAnalysisToStorage(analysis: CodebaseAnalysis): boolean {
  try {
    const existing = loadAnalysesFromStorage();

    // Compress analysis data
    const savedEntry = {
      id: analysis.id,
      name: analysis.name,
      framework: analysis.framework.detected,
      componentCount: analysis.components.length,
      analyzedAt: analysis.analyzedAt,
      data: JSON.stringify(analysis),
    };

    // Remove existing with same ID
    const filtered = existing.filter((a) => a.id !== analysis.id);

    // Add new entry at beginning
    const updated = [savedEntry, ...filtered].slice(0, 10); // Keep max 10

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch {
    console.error('Failed to save analysis to localStorage');
    return false;
  }
}

/**
 * Load all saved analyses from localStorage
 */
export function loadAnalysesFromStorage(): SavedAnalysis[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as SavedAnalysis[];
  } catch {
    return [];
  }
}

/**
 * Load a specific analysis from localStorage
 */
export function loadAnalysisById(id: string): CodebaseAnalysis | null {
  try {
    const analyses = loadAnalysesFromStorage();
    const found = analyses.find((a) => a.id === id);
    if (!found) return null;
    return JSON.parse(found.data);
  } catch {
    return null;
  }
}

/**
 * Delete an analysis from localStorage
 */
export function deleteAnalysisFromStorage(id: string): boolean {
  try {
    const analyses = loadAnalysesFromStorage();
    const filtered = analyses.filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear all saved analyses
 */
export function clearAllAnalyses(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// Export Utilities
// ============================================

/**
 * Export analysis as JSON
 */
export function exportAnalysisAsJson(analysis: CodebaseAnalysis): string {
  return JSON.stringify(analysis, null, 2);
}

/**
 * Import analysis from JSON
 */
export function importAnalysisFromJson(json: string): CodebaseAnalysis | null {
  try {
    const parsed = JSON.parse(json);
    // Basic validation
    if (!parsed.id || !parsed.framework || !parsed.components) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
