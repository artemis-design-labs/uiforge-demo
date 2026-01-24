import type {
  CodebaseFile,
  Framework,
  FrameworkAnalysis,
  DependencyInfo,
} from '../types/codebaseAnalyzer';

// ============================================
// Types
// ============================================

interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

interface DetectionResult {
  framework: Framework;
  confidence: number;
  evidence: string[];
  version?: string;
  metaFramework?: string;
}

// ============================================
// Framework Detection Rules
// ============================================

const FRAMEWORK_INDICATORS = {
  react: {
    packages: ['react', 'react-dom'],
    extensions: ['.jsx', '.tsx'],
    imports: ['react', 'React'],
    configFiles: [],
    metaFrameworks: {
      next: ['next', 'next/router', 'next/navigation'],
      remix: ['@remix-run/react'],
      gatsby: ['gatsby'],
    },
  },
  vue: {
    packages: ['vue'],
    extensions: ['.vue'],
    imports: ['vue', 'Vue'],
    configFiles: ['vue.config.js', 'vite.config.ts', 'vite.config.js'],
    metaFrameworks: {
      nuxt: ['nuxt', '@nuxt/kit'],
    },
  },
  angular: {
    packages: ['@angular/core', '@angular/common'],
    extensions: ['.component.ts', '.module.ts'],
    imports: ['@angular/core', '@angular/common'],
    configFiles: ['angular.json'],
    metaFrameworks: {},
  },
  svelte: {
    packages: ['svelte'],
    extensions: ['.svelte'],
    imports: ['svelte', 'Svelte'],
    configFiles: ['svelte.config.js'],
    metaFrameworks: {
      sveltekit: ['@sveltejs/kit'],
    },
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Parse package.json content
 */
function parsePackageJson(content: string): PackageJson | null {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Get all dependencies from package.json
 */
function getAllDependencies(pkg: PackageJson): Record<string, string> {
  return {
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.peerDependencies,
  };
}

/**
 * Check if a package exists in dependencies
 */
function hasDependency(
  deps: Record<string, string>,
  packageName: string
): boolean {
  return packageName in deps;
}

/**
 * Check if any package from a list exists
 */
function hasAnyDependency(
  deps: Record<string, string>,
  packageNames: string[]
): boolean {
  return packageNames.some((pkg) => hasDependency(deps, pkg));
}

/**
 * Count files by extension
 */
function countFilesByExtension(
  files: CodebaseFile[],
  extensions: string[]
): number {
  return files.filter((f) =>
    extensions.some((ext) => f.path.endsWith(ext))
  ).length;
}

/**
 * Check if any file contains an import
 */
function hasImportInFiles(files: CodebaseFile[], imports: string[]): boolean {
  const importPatterns = imports.map(
    (imp) => new RegExp(`(?:import|from)\\s+['"]${imp}`, 'i')
  );

  return files.some((file) =>
    importPatterns.some((pattern) => pattern.test(file.content))
  );
}

/**
 * Check for config files
 */
function hasConfigFile(files: CodebaseFile[], configFiles: string[]): boolean {
  return files.some((file) =>
    configFiles.some((config) => file.path.endsWith(config))
  );
}

/**
 * Get version from dependency
 */
function getVersion(
  deps: Record<string, string>,
  packageNames: string[]
): string | undefined {
  for (const pkg of packageNames) {
    if (deps[pkg]) {
      // Remove version prefix (^, ~, etc.)
      return deps[pkg].replace(/^[\^~>=<]/, '');
    }
  }
  return undefined;
}

// ============================================
// Main Detection Functions
// ============================================

/**
 * Detect React framework
 */
function detectReact(
  files: CodebaseFile[],
  deps: Record<string, string>
): DetectionResult | null {
  const indicators = FRAMEWORK_INDICATORS.react;
  const evidence: string[] = [];
  let confidence = 0;

  // Check package.json
  if (hasAnyDependency(deps, indicators.packages)) {
    evidence.push('react found in dependencies');
    confidence += 40;
  }

  // Check file extensions
  const jsxCount = countFilesByExtension(files, indicators.extensions);
  if (jsxCount > 0) {
    evidence.push(`Found ${jsxCount} JSX/TSX files`);
    confidence += Math.min(30, jsxCount * 3);
  }

  // Check imports
  if (hasImportInFiles(files, indicators.imports)) {
    evidence.push('React imports detected in code');
    confidence += 20;
  }

  if (confidence === 0) return null;

  // Detect meta-framework
  let metaFramework: string | undefined;
  for (const [meta, packages] of Object.entries(indicators.metaFrameworks)) {
    if (hasAnyDependency(deps, packages)) {
      metaFramework = meta;
      evidence.push(`${meta} meta-framework detected`);
      break;
    }
  }

  return {
    framework: 'react',
    confidence: Math.min(100, confidence),
    evidence,
    version: getVersion(deps, indicators.packages),
    metaFramework,
  };
}

/**
 * Detect Vue framework
 */
function detectVue(
  files: CodebaseFile[],
  deps: Record<string, string>
): DetectionResult | null {
  const indicators = FRAMEWORK_INDICATORS.vue;
  const evidence: string[] = [];
  let confidence = 0;

  // Check package.json
  if (hasAnyDependency(deps, indicators.packages)) {
    evidence.push('vue found in dependencies');
    confidence += 40;
  }

  // Check file extensions
  const vueCount = countFilesByExtension(files, indicators.extensions);
  if (vueCount > 0) {
    evidence.push(`Found ${vueCount} .vue files`);
    confidence += Math.min(40, vueCount * 5);
  }

  // Check imports
  if (hasImportInFiles(files, indicators.imports)) {
    evidence.push('Vue imports detected in code');
    confidence += 15;
  }

  if (confidence === 0) return null;

  // Detect meta-framework
  let metaFramework: string | undefined;
  for (const [meta, packages] of Object.entries(indicators.metaFrameworks)) {
    if (hasAnyDependency(deps, packages)) {
      metaFramework = meta;
      evidence.push(`${meta} meta-framework detected`);
      break;
    }
  }

  return {
    framework: 'vue',
    confidence: Math.min(100, confidence),
    evidence,
    version: getVersion(deps, indicators.packages),
    metaFramework,
  };
}

/**
 * Detect Angular framework
 */
function detectAngular(
  files: CodebaseFile[],
  deps: Record<string, string>
): DetectionResult | null {
  const indicators = FRAMEWORK_INDICATORS.angular;
  const evidence: string[] = [];
  let confidence = 0;

  // Check package.json
  if (hasAnyDependency(deps, indicators.packages)) {
    evidence.push('@angular/core found in dependencies');
    confidence += 50;
  }

  // Check for angular.json
  if (hasConfigFile(files, indicators.configFiles)) {
    evidence.push('angular.json config file found');
    confidence += 30;
  }

  // Check file patterns
  const componentCount = countFilesByExtension(files, ['.component.ts']);
  if (componentCount > 0) {
    evidence.push(`Found ${componentCount} .component.ts files`);
    confidence += Math.min(20, componentCount * 2);
  }

  // Check imports
  if (hasImportInFiles(files, indicators.imports)) {
    evidence.push('Angular imports detected in code');
    confidence += 10;
  }

  if (confidence === 0) return null;

  return {
    framework: 'angular',
    confidence: Math.min(100, confidence),
    evidence,
    version: getVersion(deps, indicators.packages),
  };
}

/**
 * Detect Svelte framework
 */
function detectSvelte(
  files: CodebaseFile[],
  deps: Record<string, string>
): DetectionResult | null {
  const indicators = FRAMEWORK_INDICATORS.svelte;
  const evidence: string[] = [];
  let confidence = 0;

  // Check package.json
  if (hasAnyDependency(deps, indicators.packages)) {
    evidence.push('svelte found in dependencies');
    confidence += 40;
  }

  // Check file extensions
  const svelteCount = countFilesByExtension(files, indicators.extensions);
  if (svelteCount > 0) {
    evidence.push(`Found ${svelteCount} .svelte files`);
    confidence += Math.min(40, svelteCount * 5);
  }

  // Check config files
  if (hasConfigFile(files, indicators.configFiles)) {
    evidence.push('svelte.config.js found');
    confidence += 15;
  }

  if (confidence === 0) return null;

  // Detect meta-framework
  let metaFramework: string | undefined;
  for (const [meta, packages] of Object.entries(indicators.metaFrameworks)) {
    if (hasAnyDependency(deps, packages)) {
      metaFramework = meta;
      evidence.push(`${meta} meta-framework detected`);
      break;
    }
  }

  return {
    framework: 'svelte',
    confidence: Math.min(100, confidence),
    evidence,
    version: getVersion(deps, indicators.packages),
    metaFramework,
  };
}

// ============================================
// Main Export Functions
// ============================================

/**
 * Detect the frontend framework used in a codebase
 */
export function detectFramework(files: CodebaseFile[]): FrameworkAnalysis {
  // Find and parse package.json
  const packageJsonFile = files.find(
    (f) => f.name === 'package.json' && !f.path.includes('/')
  ) || files.find((f) => f.name === 'package.json');

  const pkg = packageJsonFile
    ? parsePackageJson(packageJsonFile.content)
    : null;
  const deps = pkg ? getAllDependencies(pkg) : {};

  // Run all detectors
  const results: DetectionResult[] = [
    detectReact(files, deps),
    detectVue(files, deps),
    detectAngular(files, deps),
    detectSvelte(files, deps),
  ].filter((r): r is DetectionResult => r !== null);

  // Sort by confidence
  results.sort((a, b) => b.confidence - a.confidence);

  // Return the best match or unknown
  if (results.length > 0 && results[0].confidence >= 30) {
    const best = results[0];
    return {
      detected: best.framework,
      confidence: best.confidence,
      evidence: best.evidence,
      version: best.version,
      metaFramework: best.metaFramework,
    };
  }

  return {
    detected: 'unknown',
    confidence: 0,
    evidence: ['No recognized frontend framework detected'],
  };
}

/**
 * Extract dependency information from package.json
 */
export function extractDependencies(files: CodebaseFile[]): DependencyInfo[] {
  const packageJsonFile = files.find(
    (f) => f.name === 'package.json' && !f.path.includes('/')
  ) || files.find((f) => f.name === 'package.json');

  if (!packageJsonFile) {
    return [];
  }

  const pkg = parsePackageJson(packageJsonFile.content);
  if (!pkg) {
    return [];
  }

  const dependencies: DependencyInfo[] = [];

  // Add regular dependencies
  if (pkg.dependencies) {
    for (const [name, version] of Object.entries(pkg.dependencies)) {
      dependencies.push({
        name,
        version,
        isDev: false,
        category: categorizeDependency(name),
      });
    }
  }

  // Add dev dependencies
  if (pkg.devDependencies) {
    for (const [name, version] of Object.entries(pkg.devDependencies)) {
      dependencies.push({
        name,
        version,
        isDev: true,
        category: categorizeDependency(name),
      });
    }
  }

  return dependencies;
}

/**
 * Categorize a dependency by its name
 */
function categorizeDependency(name: string): string {
  // UI Libraries
  if (
    name.includes('ui') ||
    name.includes('chakra') ||
    name.includes('material') ||
    name.includes('antd') ||
    name.includes('bootstrap') ||
    name.includes('tailwind') ||
    name.includes('radix')
  ) {
    return 'ui';
  }

  // State Management
  if (
    name.includes('redux') ||
    name.includes('zustand') ||
    name.includes('mobx') ||
    name.includes('recoil') ||
    name.includes('jotai') ||
    name.includes('vuex') ||
    name.includes('pinia')
  ) {
    return 'state';
  }

  // Routing
  if (
    name.includes('router') ||
    name.includes('routing') ||
    name === 'next' ||
    name === 'nuxt'
  ) {
    return 'routing';
  }

  // Data Fetching
  if (
    name.includes('axios') ||
    name.includes('fetch') ||
    name.includes('query') ||
    name.includes('graphql') ||
    name.includes('apollo') ||
    name.includes('swr') ||
    name.includes('trpc')
  ) {
    return 'data';
  }

  // Testing
  if (
    name.includes('jest') ||
    name.includes('vitest') ||
    name.includes('testing') ||
    name.includes('cypress') ||
    name.includes('playwright') ||
    name.includes('mocha') ||
    name.includes('chai')
  ) {
    return 'testing';
  }

  // Build Tools
  if (
    name.includes('webpack') ||
    name.includes('vite') ||
    name.includes('esbuild') ||
    name.includes('rollup') ||
    name.includes('parcel') ||
    name.includes('babel') ||
    name.includes('typescript')
  ) {
    return 'build';
  }

  // Linting/Formatting
  if (
    name.includes('eslint') ||
    name.includes('prettier') ||
    name.includes('stylelint') ||
    name.includes('lint')
  ) {
    return 'linting';
  }

  return 'other';
}

/**
 * Get the project name from package.json or folder structure
 */
export function getProjectName(files: CodebaseFile[]): string {
  const packageJsonFile = files.find(
    (f) => f.name === 'package.json' && !f.path.includes('/')
  ) || files.find((f) => f.name === 'package.json');

  if (packageJsonFile) {
    const pkg = parsePackageJson(packageJsonFile.content);
    if (pkg?.name) {
      return pkg.name;
    }
  }

  // Try to get from folder structure
  const firstFile = files[0];
  if (firstFile) {
    const parts = firstFile.path.split('/');
    if (parts.length > 1) {
      return parts[0];
    }
  }

  return 'unknown-project';
}
