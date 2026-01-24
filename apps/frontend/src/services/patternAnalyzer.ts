import type {
  CodebaseFile,
  PatternAnalysis,
  StateManagement,
  StylingApproach,
  RoutingLibrary,
  ApiPattern,
  ProjectStructure,
  DependencyInfo,
} from '../types/codebaseAnalyzer';

// ============================================
// State Management Detection
// ============================================

interface StateDetectionResult {
  detected: StateManagement;
  evidence: string[];
}

const STATE_INDICATORS: Record<StateManagement, {
  packages: string[];
  filePatterns: string[];
  codePatterns: RegExp[];
}> = {
  'redux-toolkit': {
    packages: ['@reduxjs/toolkit'],
    filePatterns: ['store.ts', 'slice.ts', 'slices/'],
    codePatterns: [/createSlice\s*\(/, /configureStore\s*\(/],
  },
  redux: {
    packages: ['redux', 'react-redux'],
    filePatterns: ['store.js', 'reducers/', 'actions/'],
    codePatterns: [/createStore\s*\(/, /combineReducers\s*\(/, /useSelector\s*\(/, /useDispatch\s*\(/],
  },
  zustand: {
    packages: ['zustand'],
    filePatterns: ['store.ts', 'stores/'],
    codePatterns: [/create\s*\(\s*\([^)]*\)\s*=>\s*\(/, /useStore\s*\(/],
  },
  mobx: {
    packages: ['mobx', 'mobx-react', 'mobx-react-lite'],
    filePatterns: ['store.ts', 'stores/'],
    codePatterns: [/@observable/, /@action/, /makeObservable\s*\(/, /makeAutoObservable\s*\(/],
  },
  vuex: {
    packages: ['vuex'],
    filePatterns: ['store/index.js', 'store/index.ts'],
    codePatterns: [/createStore\s*\(/, /useStore\s*\(/],
  },
  pinia: {
    packages: ['pinia'],
    filePatterns: ['stores/'],
    codePatterns: [/defineStore\s*\(/],
  },
  context: {
    packages: [],
    filePatterns: ['context/', 'contexts/', 'providers/'],
    codePatterns: [/createContext\s*\(/, /useContext\s*\(/, /\.Provider/],
  },
  jotai: {
    packages: ['jotai'],
    filePatterns: ['atoms/', 'atoms.ts'],
    codePatterns: [/atom\s*\(/, /useAtom\s*\(/],
  },
  recoil: {
    packages: ['recoil'],
    filePatterns: ['atoms/', 'selectors/'],
    codePatterns: [/atom\s*\(\{/, /useRecoilState\s*\(/, /useRecoilValue\s*\(/],
  },
  signals: {
    packages: ['@preact/signals', '@angular/core'],
    filePatterns: [],
    codePatterns: [/signal\s*\(/, /computed\s*\(/],
  },
  none: {
    packages: [],
    filePatterns: [],
    codePatterns: [],
  },
};

function detectStateManagement(
  files: CodebaseFile[],
  dependencies: DependencyInfo[]
): StateDetectionResult {
  const depNames = dependencies.map((d) => d.name);

  // Check each state management solution
  for (const [state, indicators] of Object.entries(STATE_INDICATORS)) {
    if (state === 'none') continue;

    const evidence: string[] = [];

    // Check packages
    const hasPackage = indicators.packages.some((pkg) => depNames.includes(pkg));
    if (hasPackage) {
      evidence.push(`Found ${indicators.packages.find((p) => depNames.includes(p))} in dependencies`);
    }

    // Check file patterns
    const hasFilePattern = indicators.filePatterns.some((pattern) =>
      files.some((f) => f.path.includes(pattern))
    );
    if (hasFilePattern) {
      evidence.push(`Found files matching ${state} patterns`);
    }

    // Check code patterns
    const matchedCode = indicators.codePatterns.some((pattern) =>
      files.some((f) => pattern.test(f.content))
    );
    if (matchedCode) {
      evidence.push(`Found ${state} code patterns`);
    }

    if (evidence.length >= 2 || (hasPackage && evidence.length >= 1)) {
      return {
        detected: state as StateManagement,
        evidence,
      };
    }
  }

  return { detected: 'none', evidence: ['No state management library detected'] };
}

// ============================================
// Styling Detection
// ============================================

const STYLING_INDICATORS: Record<StylingApproach, {
  packages: string[];
  fileExtensions: string[];
  codePatterns: RegExp[];
}> = {
  tailwind: {
    packages: ['tailwindcss'],
    fileExtensions: [],
    codePatterns: [/className="[^"]*(?:flex|grid|p-\d|m-\d|text-|bg-|w-|h-)/, /class="[^"]*(?:flex|grid|p-\d|m-\d|text-|bg-|w-|h-)/],
  },
  'styled-components': {
    packages: ['styled-components'],
    fileExtensions: [],
    codePatterns: [/styled\.[a-z]+`/, /styled\([^)]+\)`/],
  },
  emotion: {
    packages: ['@emotion/react', '@emotion/styled', '@emotion/css'],
    fileExtensions: [],
    codePatterns: [/css`/, /styled\.[a-z]+`/],
  },
  'css-modules': {
    packages: [],
    fileExtensions: ['.module.css', '.module.scss'],
    codePatterns: [/className=\{styles\.[a-zA-Z]/, /className=\{css\.[a-zA-Z]/],
  },
  scss: {
    packages: ['sass', 'node-sass'],
    fileExtensions: ['.scss', '.sass'],
    codePatterns: [],
  },
  sass: {
    packages: ['sass', 'node-sass'],
    fileExtensions: ['.sass'],
    codePatterns: [],
  },
  less: {
    packages: ['less'],
    fileExtensions: ['.less'],
    codePatterns: [],
  },
  'vanilla-css': {
    packages: [],
    fileExtensions: ['.css'],
    codePatterns: [],
  },
  'css-in-js': {
    packages: [],
    fileExtensions: [],
    codePatterns: [/css\(\{/, /style=\{\{/],
  },
  unknown: {
    packages: [],
    fileExtensions: [],
    codePatterns: [],
  },
};

function detectStylingApproach(
  files: CodebaseFile[],
  dependencies: DependencyInfo[]
): StylingApproach {
  const depNames = dependencies.map((d) => d.name);

  // Priority order for detection
  const priority: StylingApproach[] = [
    'tailwind',
    'styled-components',
    'emotion',
    'css-modules',
    'scss',
    'sass',
    'less',
    'vanilla-css',
  ];

  for (const approach of priority) {
    const indicators = STYLING_INDICATORS[approach];

    // Check packages
    if (indicators.packages.some((pkg) => depNames.includes(pkg))) {
      return approach;
    }

    // Check file extensions
    if (indicators.fileExtensions.length > 0) {
      const hasFiles = indicators.fileExtensions.some((ext) =>
        files.some((f) => f.path.endsWith(ext))
      );
      if (hasFiles) {
        return approach;
      }
    }

    // Check code patterns (only for specific approaches)
    if (indicators.codePatterns.length > 0) {
      const hasPattern = indicators.codePatterns.some((pattern) =>
        files.some((f) => pattern.test(f.content))
      );
      if (hasPattern) {
        return approach;
      }
    }
  }

  return 'unknown';
}

// ============================================
// Routing Detection
// ============================================

const ROUTING_INDICATORS: Record<RoutingLibrary, {
  packages: string[];
  configFiles: string[];
  codePatterns: RegExp[];
}> = {
  'react-router': {
    packages: ['react-router', 'react-router-dom'],
    configFiles: [],
    codePatterns: [/<Route/, /<Router/, /useNavigate\(/, /useParams\(/],
  },
  'vue-router': {
    packages: ['vue-router'],
    configFiles: ['router/index.ts', 'router/index.js', 'router.ts'],
    codePatterns: [/createRouter\(/, /useRouter\(/, /useRoute\(/],
  },
  'angular-router': {
    packages: ['@angular/router'],
    configFiles: ['app-routing.module.ts', 'app.routes.ts'],
    codePatterns: [/RouterModule/, /Routes\s*=/],
  },
  next: {
    packages: ['next'],
    configFiles: ['next.config.js', 'next.config.mjs', 'next.config.ts'],
    codePatterns: [/next\/router/, /next\/navigation/, /useRouter\s*\(\s*\)/],
  },
  nuxt: {
    packages: ['nuxt', '@nuxt/kit'],
    configFiles: ['nuxt.config.ts', 'nuxt.config.js'],
    codePatterns: [/useRouter\s*\(\s*\)/, /navigateTo\s*\(/],
  },
  sveltekit: {
    packages: ['@sveltejs/kit'],
    configFiles: ['svelte.config.js'],
    codePatterns: [/\$page/, /goto\s*\(/],
  },
  'tanstack-router': {
    packages: ['@tanstack/router', '@tanstack/react-router'],
    configFiles: [],
    codePatterns: [/createRouter\(/, /createRootRoute\(/],
  },
  none: {
    packages: [],
    configFiles: [],
    codePatterns: [],
  },
};

function detectRouting(
  files: CodebaseFile[],
  dependencies: DependencyInfo[]
): RoutingLibrary {
  const depNames = dependencies.map((d) => d.name);

  // Check meta-frameworks first (they have their own routing)
  if (depNames.includes('next')) return 'next';
  if (depNames.includes('nuxt')) return 'nuxt';
  if (depNames.includes('@sveltejs/kit')) return 'sveltekit';

  for (const [router, indicators] of Object.entries(ROUTING_INDICATORS)) {
    if (router === 'none') continue;

    // Check packages
    if (indicators.packages.some((pkg) => depNames.includes(pkg))) {
      return router as RoutingLibrary;
    }

    // Check config files
    if (indicators.configFiles.some((cfg) => files.some((f) => f.path.includes(cfg)))) {
      return router as RoutingLibrary;
    }

    // Check code patterns
    if (indicators.codePatterns.some((pattern) => files.some((f) => pattern.test(f.content)))) {
      return router as RoutingLibrary;
    }
  }

  return 'none';
}

// ============================================
// API Pattern Detection
// ============================================

const API_INDICATORS: Record<ApiPattern, {
  packages: string[];
  codePatterns: RegExp[];
}> = {
  fetch: {
    packages: [],
    codePatterns: [/fetch\s*\(['"\/]/, /fetch\s*\(`/],
  },
  axios: {
    packages: ['axios'],
    codePatterns: [/axios\.[a-z]+\s*\(/, /axios\s*\(/],
  },
  graphql: {
    packages: ['graphql'],
    codePatterns: [/gql`/, /graphql\s*\(/],
  },
  apollo: {
    packages: ['@apollo/client', 'apollo-client'],
    codePatterns: [/useQuery\s*\(/, /useMutation\s*\(/, /ApolloClient/],
  },
  urql: {
    packages: ['urql', '@urql/core'],
    codePatterns: [/useQuery\s*\(/, /createClient\s*\(/],
  },
  trpc: {
    packages: ['@trpc/client', '@trpc/server'],
    codePatterns: [/trpc\.[a-z]+/, /createTRPCReact\s*\(/],
  },
  'tanstack-query': {
    packages: ['@tanstack/react-query', 'react-query'],
    codePatterns: [/useQuery\s*\(\{/, /useMutation\s*\(\{/, /QueryClient/],
  },
  swr: {
    packages: ['swr'],
    codePatterns: [/useSWR\s*\(/],
  },
  'rtk-query': {
    packages: ['@reduxjs/toolkit'],
    codePatterns: [/createApi\s*\(/, /fetchBaseQuery\s*\(/],
  },
};

function detectApiPatterns(
  files: CodebaseFile[],
  dependencies: DependencyInfo[]
): ApiPattern[] {
  const patterns: ApiPattern[] = [];
  const depNames = dependencies.map((d) => d.name);

  for (const [pattern, indicators] of Object.entries(API_INDICATORS)) {
    // Check packages
    const hasPackage = indicators.packages.some((pkg) => depNames.includes(pkg));

    // Check code patterns
    const hasCode = indicators.codePatterns.some((regex) =>
      files.some((f) => regex.test(f.content))
    );

    if (hasPackage || hasCode) {
      patterns.push(pattern as ApiPattern);
    }
  }

  return patterns;
}

// ============================================
// Testing Framework Detection
// ============================================

const TESTING_INDICATORS: Record<string, string[]> = {
  jest: ['jest', '@jest/core'],
  vitest: ['vitest'],
  mocha: ['mocha'],
  jasmine: ['jasmine'],
  cypress: ['cypress'],
  playwright: ['@playwright/test', 'playwright'],
  'testing-library': ['@testing-library/react', '@testing-library/vue'],
};

function detectTestingFrameworks(dependencies: DependencyInfo[]): string[] {
  const frameworks: string[] = [];
  const depNames = dependencies.map((d) => d.name);

  for (const [framework, packages] of Object.entries(TESTING_INDICATORS)) {
    if (packages.some((pkg) => depNames.includes(pkg))) {
      frameworks.push(framework);
    }
  }

  return frameworks;
}

// ============================================
// Build Tool Detection
// ============================================

const BUILD_INDICATORS: Record<string, string[]> = {
  vite: ['vite'],
  webpack: ['webpack'],
  esbuild: ['esbuild'],
  rollup: ['rollup'],
  parcel: ['parcel', '@parcel/core'],
  turbopack: ['next'], // Part of Next.js
  'create-react-app': ['react-scripts'],
  tsup: ['tsup'],
};

function detectBuildTools(
  files: CodebaseFile[],
  dependencies: DependencyInfo[]
): string[] {
  const tools: string[] = [];
  const depNames = dependencies.map((d) => d.name);

  // Check dependencies
  for (const [tool, packages] of Object.entries(BUILD_INDICATORS)) {
    if (packages.some((pkg) => depNames.includes(pkg))) {
      tools.push(tool);
    }
  }

  // Check for config files
  if (files.some((f) => f.name.startsWith('vite.config'))) {
    if (!tools.includes('vite')) tools.push('vite');
  }
  if (files.some((f) => f.name.startsWith('webpack.config'))) {
    if (!tools.includes('webpack')) tools.push('webpack');
  }
  if (files.some((f) => f.name.startsWith('rollup.config'))) {
    if (!tools.includes('rollup')) tools.push('rollup');
  }

  return tools;
}

// ============================================
// Project Structure Detection
// ============================================

function detectProjectStructure(files: CodebaseFile[]): ProjectStructure {
  const paths = files.map((f) => f.path);

  // Find source directory
  let sourceDir = '';
  const sourceDirs = ['src', 'app', 'lib', 'source'];
  for (const dir of sourceDirs) {
    if (paths.some((p) => p.startsWith(`${dir}/`))) {
      sourceDir = dir;
      break;
    }
  }

  // Find components directory
  const componentsDirs = [
    `${sourceDir}/components`,
    'components',
    `${sourceDir}/Components`,
  ];
  const componentsDir = componentsDirs.find((d) =>
    paths.some((p) => p.startsWith(`${d}/`))
  );

  // Find pages directory
  const pagesDirs = [
    `${sourceDir}/pages`,
    `${sourceDir}/app`,
    'pages',
    'app',
  ];
  const pagesDir = pagesDirs.find((d) =>
    paths.some((p) => p.startsWith(`${d}/`))
  );

  // Find styles directory
  const stylesDirs = [
    `${sourceDir}/styles`,
    `${sourceDir}/css`,
    'styles',
    'css',
  ];
  const stylesDir = stylesDirs.find((d) =>
    paths.some((p) => p.startsWith(`${d}/`))
  );

  // Find utils directory
  const utilsDirs = [
    `${sourceDir}/utils`,
    `${sourceDir}/helpers`,
    `${sourceDir}/lib`,
    'utils',
    'helpers',
  ];
  const utilsDir = utilsDirs.find((d) =>
    paths.some((p) => p.startsWith(`${d}/`))
  );

  // Find API/services directory
  const apiDirs = [
    `${sourceDir}/api`,
    `${sourceDir}/services`,
    'api',
    'services',
  ];
  const apiDir = apiDirs.find((d) =>
    paths.some((p) => p.startsWith(`${d}/`))
  );

  // Find store directory
  const storeDirs = [
    `${sourceDir}/store`,
    `${sourceDir}/stores`,
    `${sourceDir}/state`,
    'store',
    'stores',
  ];
  const storeDir = storeDirs.find((d) =>
    paths.some((p) => p.startsWith(`${d}/`))
  );

  // Find config files
  const configFiles = files
    .filter((f) =>
      f.name.endsWith('.config.js') ||
      f.name.endsWith('.config.ts') ||
      f.name.endsWith('.config.mjs') ||
      f.name === 'package.json' ||
      f.name === 'tsconfig.json' ||
      f.name === '.eslintrc.js' ||
      f.name === '.prettierrc'
    )
    .map((f) => f.name);

  return {
    sourceDir: sourceDir || '.',
    componentsDir,
    pagesDir,
    stylesDir,
    utilsDir,
    apiDir,
    storeDir,
    configFiles,
  };
}

// ============================================
// Other Patterns Detection
// ============================================

function detectOtherPatterns(
  files: CodebaseFile[],
  dependencies: DependencyInfo[]
): string[] {
  const patterns: string[] = [];
  const depNames = dependencies.map((d) => d.name);

  // Form libraries
  if (depNames.includes('react-hook-form')) patterns.push('react-hook-form');
  if (depNames.includes('formik')) patterns.push('formik');
  if (depNames.includes('vee-validate')) patterns.push('vee-validate');

  // Animation libraries
  if (depNames.includes('framer-motion')) patterns.push('framer-motion');
  if (depNames.includes('gsap')) patterns.push('gsap');
  if (depNames.includes('@react-spring/web')) patterns.push('react-spring');

  // Internationalization
  if (depNames.includes('i18next') || depNames.includes('react-i18next')) {
    patterns.push('i18n');
  }
  if (depNames.includes('vue-i18n')) patterns.push('i18n');

  // Date handling
  if (depNames.includes('date-fns')) patterns.push('date-fns');
  if (depNames.includes('dayjs')) patterns.push('dayjs');
  if (depNames.includes('moment')) patterns.push('moment');

  // Validation
  if (depNames.includes('zod')) patterns.push('zod');
  if (depNames.includes('yup')) patterns.push('yup');
  if (depNames.includes('joi')) patterns.push('joi');

  // PWA
  if (files.some((f) => f.name === 'manifest.json' || f.name === 'sw.js')) {
    patterns.push('pwa');
  }

  // TypeScript
  if (files.some((f) => f.name === 'tsconfig.json')) {
    patterns.push('typescript');
  }

  return patterns;
}

// ============================================
// Main Export Function
// ============================================

/**
 * Analyze patterns in the codebase
 */
export function analyzePatterns(
  files: CodebaseFile[],
  dependencies: DependencyInfo[]
): PatternAnalysis {
  const stateResult = detectStateManagement(files, dependencies);

  return {
    stateManagement: stateResult.detected,
    styling: detectStylingApproach(files, dependencies),
    routing: detectRouting(files, dependencies),
    apiPatterns: detectApiPatterns(files, dependencies),
    testingFrameworks: detectTestingFrameworks(dependencies),
    buildTools: detectBuildTools(files, dependencies),
    otherPatterns: detectOtherPatterns(files, dependencies),
  };
}

/**
 * Detect project structure
 */
export { detectProjectStructure };
