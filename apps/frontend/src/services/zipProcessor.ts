import JSZip from 'jszip';
import type { CodebaseFile, FileTreeNode } from '../types/codebaseAnalyzer';

// ============================================
// Configuration
// ============================================

/** Folders to ignore when processing ZIP files */
const IGNORED_FOLDERS = [
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '.output',
  '.cache',
  '.parcel-cache',
  'coverage',
  '.nyc_output',
  '__pycache__',
  '.pytest_cache',
  'vendor',
  'bower_components',
  '.idea',
  '.vscode',
  '.DS_Store',
  'Thumbs.db',
];

/** File extensions to include (code and config files) */
const INCLUDED_EXTENSIONS = [
  // JavaScript/TypeScript
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  // Vue
  'vue',
  // Svelte
  'svelte',
  // Angular
  'component.ts', 'module.ts', 'service.ts',
  // Styles
  'css', 'scss', 'sass', 'less', 'styl',
  // Config
  'json', 'yaml', 'yml', 'toml',
  // HTML
  'html', 'htm',
  // Other
  'md', 'mdx',
];

/** Maximum file size to process (in bytes) - 1MB */
const MAX_FILE_SIZE = 1 * 1024 * 1024;

/** Maximum total size for all files (in bytes) - 50MB */
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a path should be ignored
 */
function shouldIgnorePath(path: string): boolean {
  const parts = path.split('/');
  return parts.some(part =>
    IGNORED_FOLDERS.includes(part) ||
    part.startsWith('.')
  );
}

/**
 * Check if a file should be included based on extension
 */
function shouldIncludeFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  // Always include package.json and config files
  const alwaysInclude = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'vite.config.js',
    'next.config.js',
    'next.config.mjs',
    'next.config.ts',
    'nuxt.config.ts',
    'nuxt.config.js',
    'angular.json',
    'svelte.config.js',
    'tailwind.config.js',
    'tailwind.config.ts',
    '.eslintrc',
    '.eslintrc.js',
    '.eslintrc.json',
  ];

  if (alwaysInclude.some(f => filename.endsWith(f))) {
    return true;
  }

  return INCLUDED_EXTENSIONS.includes(ext);
}

/**
 * Get file extension from filename
 */
function getExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length === 1) return '';
  return parts.pop()?.toLowerCase() || '';
}

/**
 * Read file content as text
 */
async function readFileAsText(file: JSZip.JSZipObject): Promise<string> {
  try {
    return await file.async('string');
  } catch {
    // Binary or unreadable file
    return '';
  }
}

// ============================================
// Main Functions
// ============================================

export interface ProcessZipResult {
  files: CodebaseFile[];
  fileTree: FileTreeNode;
  totalSize: number;
  fileCount: number;
  errors: string[];
}

export interface ProcessZipOptions {
  onProgress?: (progress: number, currentFile: string) => void;
  maxFileSize?: number;
  maxTotalSize?: number;
}

/**
 * Process a ZIP file and extract code files
 */
export async function processZipFile(
  file: File,
  options: ProcessZipOptions = {}
): Promise<ProcessZipResult> {
  const {
    onProgress,
    maxFileSize = MAX_FILE_SIZE,
    maxTotalSize = MAX_TOTAL_SIZE,
  } = options;

  const errors: string[] = [];
  const files: CodebaseFile[] = [];
  let totalSize = 0;

  // Load the ZIP file
  const zip = await JSZip.loadAsync(file);

  // Get all file entries
  const entries = Object.entries(zip.files);
  const totalEntries = entries.length;
  let processedEntries = 0;

  // Find the root directory (handle ZIPs with a single root folder)
  let rootPrefix = '';
  const firstEntry = entries[0];
  if (firstEntry && firstEntry[1].dir) {
    // Check if all entries start with this directory
    const potentialRoot = firstEntry[0];
    const allStartWithRoot = entries.every(([path]) =>
      path.startsWith(potentialRoot)
    );
    if (allStartWithRoot) {
      rootPrefix = potentialRoot;
    }
  }

  // Process each file
  for (const [path, zipEntry] of entries) {
    processedEntries++;

    // Remove root prefix if exists
    const relativePath = rootPrefix ? path.slice(rootPrefix.length) : path;

    // Skip if empty path or if it's the root itself
    if (!relativePath || relativePath === '/') continue;

    // Report progress
    if (onProgress) {
      const progress = Math.round((processedEntries / totalEntries) * 100);
      onProgress(progress, relativePath);
    }

    // Skip directories
    if (zipEntry.dir) continue;

    // Skip ignored paths
    if (shouldIgnorePath(relativePath)) continue;

    // Get filename
    const filename = relativePath.split('/').pop() || '';

    // Skip files that shouldn't be included
    if (!shouldIncludeFile(filename)) continue;

    // Check file size (use internal data if available)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uncompressedSize = (zipEntry as any)._data?.uncompressedSize || 0;
    if (uncompressedSize > maxFileSize) {
      errors.push(`Skipped ${relativePath}: file too large (${Math.round(uncompressedSize / 1024)}KB)`);
      continue;
    }

    // Check total size limit
    if (totalSize + uncompressedSize > maxTotalSize) {
      errors.push(`Stopped processing: total size limit reached (${Math.round(maxTotalSize / 1024 / 1024)}MB)`);
      break;
    }

    // Read file content
    const content = await readFileAsText(zipEntry);

    // Skip binary or unreadable files
    if (!content) continue;

    // Create file entry
    const codebaseFile: CodebaseFile = {
      path: relativePath,
      name: filename,
      extension: getExtension(filename),
      content,
      size: content.length,
      isDirectory: false,
    };

    files.push(codebaseFile);
    totalSize += content.length;
  }

  // Build file tree
  const fileTree = buildFileTree(files);

  return {
    files,
    fileTree,
    totalSize,
    fileCount: files.length,
    errors,
  };
}

/**
 * Build a file tree structure from flat file list
 */
export function buildFileTree(files: CodebaseFile[]): FileTreeNode {
  const root: FileTreeNode = {
    name: 'root',
    path: '',
    type: 'directory',
    children: [],
  };

  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      if (isFile) {
        // Add file node
        current.children = current.children || [];
        current.children.push({
          name: part,
          path: currentPath,
          type: 'file',
          extension: file.extension,
        });
      } else {
        // Find or create directory node
        current.children = current.children || [];
        let dir = current.children.find(
          (c) => c.name === part && c.type === 'directory'
        );

        if (!dir) {
          dir = {
            name: part,
            path: currentPath,
            type: 'directory',
            children: [],
          };
          current.children.push(dir);
        }

        current = dir;
      }
    }
  }

  // Sort children: directories first, then files, both alphabetically
  sortFileTree(root);

  return root;
}

/**
 * Recursively sort file tree
 */
function sortFileTree(node: FileTreeNode): void {
  if (!node.children) return;

  node.children.sort((a, b) => {
    // Directories first
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    // Then alphabetically
    return a.name.localeCompare(b.name);
  });

  // Recurse into directories
  for (const child of node.children) {
    if (child.type === 'directory') {
      sortFileTree(child);
    }
  }
}

/**
 * Validate ZIP file before processing
 */
export function validateZipFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.name.endsWith('.zip')) {
    return { valid: false, error: 'File must be a ZIP archive' };
  }

  // Check file size (100MB max)
  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB`
    };
  }

  return { valid: true };
}

/**
 * Get statistics about extracted files
 */
export function getFileStatistics(files: CodebaseFile[]): {
  byExtension: Record<string, number>;
  totalLines: number;
  largestFile: { path: string; size: number } | null;
} {
  const byExtension: Record<string, number> = {};
  let totalLines = 0;
  let largestFile: { path: string; size: number } | null = null;

  for (const file of files) {
    // Count by extension
    const ext = file.extension || 'no-ext';
    byExtension[ext] = (byExtension[ext] || 0) + 1;

    // Count lines
    totalLines += file.content.split('\n').length;

    // Track largest file
    if (!largestFile || file.size > largestFile.size) {
      largestFile = { path: file.path, size: file.size };
    }
  }

  return { byExtension, totalLines, largestFile };
}
