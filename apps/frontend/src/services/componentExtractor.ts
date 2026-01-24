import type {
  CodebaseFile,
  Framework,
  ExtractedComponent,
  ExtractedProp,
  ComponentType,
  StylingApproach,
} from '../types/codebaseAnalyzer';

// ============================================
// React Component Extraction
// ============================================

/**
 * Extract React components from JSX/TSX files
 */
function extractReactComponents(files: CodebaseFile[]): ExtractedComponent[] {
  const components: ExtractedComponent[] = [];
  const jsxFiles = files.filter(
    (f) => f.extension === 'jsx' || f.extension === 'tsx'
  );

  for (const file of jsxFiles) {
    const extracted = extractReactComponentsFromFile(file);
    components.push(...extracted);
  }

  return components;
}

/**
 * Extract React components from a single file
 */
function extractReactComponentsFromFile(file: CodebaseFile): ExtractedComponent[] {
  const components: ExtractedComponent[] = [];
  const content = file.content;
  const lines = content.split('\n');

  // Extract imports
  const imports = extractImports(content);

  // Detect styling approach
  const styleApproach = detectStylingApproach(content, imports);

  // Find functional components
  const functionalPatterns = [
    // export function ComponentName
    /export\s+(?:default\s+)?function\s+([A-Z][a-zA-Z0-9]*)\s*(?:<[^>]*>)?\s*\(/g,
    // export const ComponentName = (
    /export\s+(?:default\s+)?const\s+([A-Z][a-zA-Z0-9]*)\s*(?::\s*(?:React\.)?FC[^=]*)?\s*=\s*(?:\([^)]*\)|[a-zA-Z]+)\s*=>/g,
    // const ComponentName = function
    /(?:export\s+)?const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*function\s*(?:<[^>]*>)?\s*\(/g,
    // function ComponentName (not exported but used as component)
    /^function\s+([A-Z][a-zA-Z0-9]*)\s*(?:<[^>]*>)?\s*\(/gm,
  ];

  const foundComponents = new Set<string>();

  for (const pattern of functionalPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const componentName = match[1];
      if (!foundComponents.has(componentName)) {
        foundComponents.add(componentName);

        // Extract props for this component
        const props = extractReactProps(content, componentName);

        // Extract hooks used
        const hooks = extractReactHooks(content);

        // Find child components
        const childComponents = extractChildComponents(content, componentName);

        // Detect exports
        const exports = detectExports(content, componentName);

        // Find component line number
        const startLine = findLineNumber(lines, match[0]);

        components.push({
          name: componentName,
          filePath: file.path,
          type: 'functional',
          props,
          imports,
          exports,
          hasStyles: hasStyles(content),
          styleApproach,
          stateUsage: extractStateUsage(content),
          hooks,
          childComponents,
          startLine,
        });
      }
    }
  }

  // Find class components
  const classPattern = /class\s+([A-Z][a-zA-Z0-9]*)\s+extends\s+(?:React\.)?(?:Component|PureComponent)/g;
  let classMatch;
  while ((classMatch = classPattern.exec(content)) !== null) {
    const componentName = classMatch[1];
    if (!foundComponents.has(componentName)) {
      foundComponents.add(componentName);

      components.push({
        name: componentName,
        filePath: file.path,
        type: 'class',
        props: extractReactClassProps(content, componentName),
        imports,
        exports: detectExports(content, componentName),
        hasStyles: hasStyles(content),
        styleApproach,
        stateUsage: extractStateUsage(content),
        hooks: [],
        childComponents: extractChildComponents(content, componentName),
        startLine: findLineNumber(lines, classMatch[0]),
      });
    }
  }

  return components;
}

/**
 * Extract props from React functional component
 */
function extractReactProps(content: string, componentName: string): ExtractedProp[] {
  const props: ExtractedProp[] = [];

  // Look for interface or type definition
  const interfacePatterns = [
    new RegExp(`interface\\s+${componentName}Props\\s*\\{([^}]+)\\}`, 's'),
    new RegExp(`type\\s+${componentName}Props\\s*=\\s*\\{([^}]+)\\}`, 's'),
    new RegExp(`interface\\s+Props\\s*\\{([^}]+)\\}`, 's'),
    new RegExp(`type\\s+Props\\s*=\\s*\\{([^}]+)\\}`, 's'),
  ];

  for (const pattern of interfacePatterns) {
    const match = content.match(pattern);
    if (match) {
      const propsContent = match[1];
      const propLines = propsContent.split('\n');

      for (const line of propLines) {
        const propMatch = line.match(/^\s*(\w+)(\?)?:\s*([^;]+)/);
        if (propMatch) {
          props.push({
            name: propMatch[1],
            type: propMatch[3].trim(),
            required: !propMatch[2],
          });
        }
      }
      break;
    }
  }

  // Also check for destructured props in function signature
  const destructuredPattern = new RegExp(
    `function\\s+${componentName}\\s*\\(\\s*\\{([^}]+)\\}`,
    's'
  );
  const destructuredMatch = content.match(destructuredPattern);
  if (destructuredMatch && props.length === 0) {
    const propsContent = destructuredMatch[1];
    const propNames = propsContent.split(',').map((p) => p.trim().split(/[=:]/)[0].trim());
    for (const name of propNames) {
      if (name && !props.find((p) => p.name === name)) {
        props.push({
          name,
          type: 'unknown',
          required: true,
        });
      }
    }
  }

  return props;
}

/**
 * Extract props from React class component
 */
function extractReactClassProps(content: string, componentName: string): ExtractedProp[] {
  // Similar to functional, but also check static propTypes
  const props = extractReactProps(content, componentName);

  // Check for PropTypes
  const propTypesPattern = new RegExp(
    `${componentName}\\.propTypes\\s*=\\s*\\{([^}]+)\\}`,
    's'
  );
  const propTypesMatch = content.match(propTypesPattern);
  if (propTypesMatch && props.length === 0) {
    const propsContent = propTypesMatch[1];
    const propLines = propsContent.split('\n');

    for (const line of propLines) {
      const propMatch = line.match(/^\s*(\w+):\s*PropTypes\.(\w+)/);
      if (propMatch) {
        props.push({
          name: propMatch[1],
          type: propMatch[2],
          required: line.includes('.isRequired'),
        });
      }
    }
  }

  return props;
}

/**
 * Extract React hooks from content
 */
function extractReactHooks(content: string): string[] {
  const hooks: string[] = [];
  const hookPattern = /\buse[A-Z][a-zA-Z]*\b/g;
  let match;
  const seen = new Set<string>();

  while ((match = hookPattern.exec(content)) !== null) {
    if (!seen.has(match[0])) {
      seen.add(match[0]);
      hooks.push(match[0]);
    }
  }

  return hooks;
}

// ============================================
// Vue Component Extraction
// ============================================

/**
 * Extract Vue components from .vue files
 */
function extractVueComponents(files: CodebaseFile[]): ExtractedComponent[] {
  const components: ExtractedComponent[] = [];
  const vueFiles = files.filter((f) => f.extension === 'vue');

  for (const file of vueFiles) {
    const component = extractVueComponentFromFile(file);
    if (component) {
      components.push(component);
    }
  }

  return components;
}

/**
 * Extract Vue component from a single file
 */
function extractVueComponentFromFile(file: CodebaseFile): ExtractedComponent | null {
  const content = file.content;

  // Get component name from file name
  const componentName = file.name.replace('.vue', '');

  // Extract script content
  const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  const scriptContent = scriptMatch ? scriptMatch[1] : '';

  // Detect if it's Composition API or Options API
  const isCompositionAPI =
    scriptContent.includes('defineComponent') ||
    scriptContent.includes('setup()') ||
    content.includes('<script setup');

  // Extract props
  const props = extractVueProps(scriptContent, content);

  // Extract imports
  const imports = extractImports(scriptContent);

  // Detect styling
  const hasStyleBlock = content.includes('<style');
  const styleApproach = detectVueStyling(content);

  return {
    name: componentName,
    filePath: file.path,
    type: 'sfc',
    props,
    imports,
    exports: ['default'],
    hasStyles: hasStyleBlock,
    styleApproach,
    stateUsage: extractVueStateUsage(scriptContent),
    hooks: isCompositionAPI ? extractVueComposables(scriptContent) : [],
    childComponents: extractVueChildComponents(content),
  };
}

/**
 * Extract Vue props
 */
function extractVueProps(scriptContent: string, fullContent: string): ExtractedProp[] {
  const props: ExtractedProp[] = [];

  // Check for defineProps (Composition API with script setup)
  const definePropsMatch = fullContent.match(
    /defineProps<\{([\s\S]*?)\}>/
  ) || fullContent.match(
    /defineProps\(\{([\s\S]*?)\}\)/
  );

  if (definePropsMatch) {
    const propsContent = definePropsMatch[1];
    const propLines = propsContent.split('\n');

    for (const line of propLines) {
      const propMatch = line.match(/^\s*(\w+)(\?)?:\s*([^;,]+)/);
      if (propMatch) {
        props.push({
          name: propMatch[1],
          type: propMatch[3].trim(),
          required: !propMatch[2],
        });
      }
    }
  }

  // Check for props in Options API
  const optionsPropsMatch = scriptContent.match(/props:\s*\{([\s\S]*?)\}/);
  if (optionsPropsMatch && props.length === 0) {
    const propsContent = optionsPropsMatch[1];
    const propPattern = /(\w+):\s*\{[^}]*type:\s*(\w+)[^}]*required:\s*(true|false)?/g;
    let propMatch;

    while ((propMatch = propPattern.exec(propsContent)) !== null) {
      props.push({
        name: propMatch[1],
        type: propMatch[2].toLowerCase(),
        required: propMatch[3] === 'true',
      });
    }
  }

  return props;
}

/**
 * Extract Vue composables (equivalent to hooks)
 */
function extractVueComposables(content: string): string[] {
  const composables: string[] = [];
  const pattern = /\buse[A-Z][a-zA-Z]*\b/g;
  let match;
  const seen = new Set<string>();

  while ((match = pattern.exec(content)) !== null) {
    if (!seen.has(match[0])) {
      seen.add(match[0]);
      composables.push(match[0]);
    }
  }

  return composables;
}

/**
 * Extract Vue state usage
 */
function extractVueStateUsage(content: string): string[] {
  const usage: string[] = [];

  if (content.includes('ref(') || content.includes('ref<')) {
    usage.push('ref');
  }
  if (content.includes('reactive(')) {
    usage.push('reactive');
  }
  if (content.includes('computed(')) {
    usage.push('computed');
  }
  if (content.includes('watch(') || content.includes('watchEffect(')) {
    usage.push('watch');
  }
  if (content.includes('data()') || content.includes('data:')) {
    usage.push('options-data');
  }

  return usage;
}

/**
 * Detect Vue styling approach
 */
function detectVueStyling(content: string): StylingApproach {
  if (content.includes('<style scoped')) {
    if (content.includes('lang="scss"') || content.includes("lang='scss'")) {
      return 'scss';
    }
    return 'css-modules';
  }
  if (content.includes('<style')) {
    return 'vanilla-css';
  }
  return 'unknown';
}

/**
 * Extract Vue child components
 */
function extractVueChildComponents(content: string): string[] {
  const children: string[] = [];

  // Look for PascalCase component usage in template
  const templateMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/);
  if (templateMatch) {
    const template = templateMatch[1];
    const componentPattern = /<([A-Z][a-zA-Z0-9]+)/g;
    let match;
    const seen = new Set<string>();

    while ((match = componentPattern.exec(template)) !== null) {
      if (!seen.has(match[1])) {
        seen.add(match[1]);
        children.push(match[1]);
      }
    }
  }

  return children;
}

// ============================================
// Angular Component Extraction
// ============================================

/**
 * Extract Angular components
 */
function extractAngularComponents(files: CodebaseFile[]): ExtractedComponent[] {
  const components: ExtractedComponent[] = [];
  const componentFiles = files.filter(
    (f) => f.path.includes('.component.ts')
  );

  for (const file of componentFiles) {
    const component = extractAngularComponentFromFile(file);
    if (component) {
      components.push(component);
    }
  }

  return components;
}

/**
 * Extract Angular component from file
 */
function extractAngularComponentFromFile(file: CodebaseFile): ExtractedComponent | null {
  const content = file.content;

  // Check for @Component decorator
  if (!content.includes('@Component')) {
    return null;
  }

  // Extract component class name
  const classMatch = content.match(
    /@Component[\s\S]*?\)\s*(?:export\s+)?class\s+(\w+)/
  );
  if (!classMatch) {
    return null;
  }

  const componentName = classMatch[1];

  // Extract @Input() props
  const props = extractAngularInputs(content);

  // Extract imports
  const imports = extractImports(content);

  return {
    name: componentName,
    filePath: file.path,
    type: 'class',
    props,
    imports,
    exports: [componentName],
    hasStyles: content.includes('styleUrls') || content.includes('styles:'),
    styleApproach: detectAngularStyling(content, file.path, imports),
    stateUsage: [],
    hooks: extractAngularLifecycle(content),
    childComponents: [],
  };
}

/**
 * Extract Angular @Input() decorators
 */
function extractAngularInputs(content: string): ExtractedProp[] {
  const props: ExtractedProp[] = [];

  // Match @Input() propertyName: type
  const inputPattern = /@Input\(\s*(?:['"][^'"]*['"])?\s*\)\s*(\w+)(?:\?)?(?:!)?:\s*([^;=]+)/g;
  let match;

  while ((match = inputPattern.exec(content)) !== null) {
    props.push({
      name: match[1],
      type: match[2].trim(),
      required: !content.includes(`${match[1]}?:`),
    });
  }

  return props;
}

/**
 * Extract Angular lifecycle hooks
 */
function extractAngularLifecycle(content: string): string[] {
  const hooks: string[] = [];
  const lifecycleHooks = [
    'ngOnInit',
    'ngOnDestroy',
    'ngOnChanges',
    'ngDoCheck',
    'ngAfterContentInit',
    'ngAfterContentChecked',
    'ngAfterViewInit',
    'ngAfterViewChecked',
  ];

  for (const hook of lifecycleHooks) {
    if (content.includes(hook)) {
      hooks.push(hook);
    }
  }

  return hooks;
}

/**
 * Detect Angular styling approach
 */
function detectAngularStyling(
  content: string,
  filePath: string,
  imports: string[]
): StylingApproach {
  if (content.includes('.scss')) return 'scss';
  if (content.includes('.sass')) return 'sass';
  if (content.includes('.less')) return 'less';
  return 'vanilla-css';
}

// ============================================
// Svelte Component Extraction
// ============================================

/**
 * Extract Svelte components
 */
function extractSvelteComponents(files: CodebaseFile[]): ExtractedComponent[] {
  const components: ExtractedComponent[] = [];
  const svelteFiles = files.filter((f) => f.extension === 'svelte');

  for (const file of svelteFiles) {
    const component = extractSvelteComponentFromFile(file);
    if (component) {
      components.push(component);
    }
  }

  return components;
}

/**
 * Extract Svelte component from file
 */
function extractSvelteComponentFromFile(file: CodebaseFile): ExtractedComponent | null {
  const content = file.content;
  const componentName = file.name.replace('.svelte', '');

  // Extract script content
  const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  const scriptContent = scriptMatch ? scriptMatch[1] : '';

  // Extract props (export let)
  const props = extractSvelteProps(scriptContent);

  // Extract imports
  const imports = extractImports(scriptContent);

  return {
    name: componentName,
    filePath: file.path,
    type: 'sfc',
    props,
    imports,
    exports: ['default'],
    hasStyles: content.includes('<style'),
    styleApproach: detectSvelteStyling(content),
    stateUsage: extractSvelteStateUsage(scriptContent),
    hooks: [],
    childComponents: extractSvelteChildComponents(content),
  };
}

/**
 * Extract Svelte props
 */
function extractSvelteProps(content: string): ExtractedProp[] {
  const props: ExtractedProp[] = [];

  // Match export let propName: type = defaultValue
  const propPattern = /export\s+let\s+(\w+)(?::\s*([^=;\n]+))?(?:\s*=\s*([^;\n]+))?/g;
  let match;

  while ((match = propPattern.exec(content)) !== null) {
    props.push({
      name: match[1],
      type: match[2]?.trim() || 'unknown',
      required: !match[3],
      defaultValue: match[3]?.trim(),
    });
  }

  return props;
}

/**
 * Extract Svelte state usage
 */
function extractSvelteStateUsage(content: string): string[] {
  const usage: string[] = [];

  if (content.includes('$:')) {
    usage.push('reactive-statements');
  }
  if (content.includes('writable(') || content.includes('readable(')) {
    usage.push('stores');
  }

  return usage;
}

/**
 * Detect Svelte styling approach
 */
function detectSvelteStyling(content: string): StylingApproach {
  if (content.includes('lang="scss"') || content.includes("lang='scss'")) {
    return 'scss';
  }
  if (content.includes('<style')) {
    return 'vanilla-css';
  }
  return 'unknown';
}

/**
 * Extract Svelte child components
 */
function extractSvelteChildComponents(content: string): string[] {
  const children: string[] = [];
  const componentPattern = /<([A-Z][a-zA-Z0-9]+)/g;
  let match;
  const seen = new Set<string>();

  while ((match = componentPattern.exec(content)) !== null) {
    if (!seen.has(match[1])) {
      seen.add(match[1]);
      children.push(match[1]);
    }
  }

  return children;
}

// ============================================
// Shared Helper Functions
// ============================================

/**
 * Extract import statements from content
 */
function extractImports(content: string): string[] {
  const imports: string[] = [];
  const importPattern = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;

  while ((match = importPattern.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

/**
 * Detect styling approach from content and imports
 */
function detectStylingApproach(
  content: string,
  imports: string[]
): StylingApproach {
  // Check imports
  if (imports.some((i) => i.includes('styled-components') || i.includes('@emotion'))) {
    return 'styled-components';
  }
  if (imports.some((i) => i.includes('@emotion'))) {
    return 'emotion';
  }

  // Check content patterns
  if (content.includes('className={styles.') || content.includes('className={css.')) {
    return 'css-modules';
  }
  if (content.includes('className="') && content.match(/className="[^"]*(?:flex|grid|p-|m-|text-|bg-)/)) {
    return 'tailwind';
  }
  if (content.includes('styled.') || content.includes('styled(')) {
    return 'styled-components';
  }
  if (content.includes('css`') || content.includes('css({')) {
    return 'css-in-js';
  }

  // Check for style imports
  if (imports.some((i) => i.endsWith('.scss') || i.endsWith('.sass'))) {
    return 'scss';
  }
  if (imports.some((i) => i.endsWith('.css'))) {
    return 'vanilla-css';
  }
  if (imports.some((i) => i.endsWith('.module.css') || i.endsWith('.module.scss'))) {
    return 'css-modules';
  }

  return 'unknown';
}

/**
 * Check if content has style references
 */
function hasStyles(content: string): boolean {
  return (
    content.includes('.css') ||
    content.includes('.scss') ||
    content.includes('.sass') ||
    content.includes('.less') ||
    content.includes('styled') ||
    content.includes('className') ||
    content.includes('style=')
  );
}

/**
 * Extract state usage patterns
 */
function extractStateUsage(content: string): string[] {
  const usage: string[] = [];

  if (content.includes('useState')) usage.push('useState');
  if (content.includes('useReducer')) usage.push('useReducer');
  if (content.includes('useContext')) usage.push('useContext');
  if (content.includes('useSelector') || content.includes('useDispatch')) {
    usage.push('redux');
  }
  if (content.includes('useStore') || content.includes('create(')) {
    usage.push('zustand');
  }
  if (content.includes('useAtom')) usage.push('jotai');
  if (content.includes('useRecoilState')) usage.push('recoil');

  return usage;
}

/**
 * Extract child component references
 */
function extractChildComponents(content: string, currentComponent: string): string[] {
  const children: string[] = [];
  const componentPattern = /<([A-Z][a-zA-Z0-9]+)/g;
  let match;
  const seen = new Set<string>();

  while ((match = componentPattern.exec(content)) !== null) {
    const name = match[1];
    // Skip self-reference and HTML-like elements
    if (name !== currentComponent && !seen.has(name)) {
      seen.add(name);
      children.push(name);
    }
  }

  return children;
}

/**
 * Detect exports for a component
 */
function detectExports(content: string, componentName: string): string[] {
  const exports: string[] = [];

  if (content.includes(`export default ${componentName}`) ||
      content.includes(`export default function ${componentName}`)) {
    exports.push('default');
  }
  if (content.includes(`export { ${componentName}`) ||
      content.includes(`export const ${componentName}`) ||
      content.includes(`export function ${componentName}`)) {
    exports.push('named');
  }

  return exports;
}

/**
 * Find line number of a match
 */
function findLineNumber(lines: string[], searchText: string): number {
  const searchStart = searchText.substring(0, 30);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchStart)) {
      return i + 1;
    }
  }
  return 1;
}

// ============================================
// Main Export Function
// ============================================

/**
 * Extract components from codebase based on detected framework
 */
export function extractComponents(
  files: CodebaseFile[],
  framework: Framework
): ExtractedComponent[] {
  switch (framework) {
    case 'react':
      return extractReactComponents(files);
    case 'vue':
      return extractVueComponents(files);
    case 'angular':
      return extractAngularComponents(files);
    case 'svelte':
      return extractSvelteComponents(files);
    default:
      // Try React as fallback since it's most common
      return extractReactComponents(files);
  }
}
