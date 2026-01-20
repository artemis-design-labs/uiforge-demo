/**
 * PackageGenerator Service
 *
 * Generates a complete npm package from Figma components.
 * Creates MUI-style component library with proper exports, types, and theme.
 */

import { generateComponentCode, type FigmaComponentProp } from './codeGenerator';

interface ComponentDefinition {
    name: string;
    nodeId: string;
    properties: Record<string, FigmaComponentProp>;
}

interface PackageConfig {
    packageName: string;
    version: string;
    description: string;
    author: string;
    license: string;
}

interface GeneratedFile {
    path: string;
    content: string;
}

interface GeneratedPackage {
    files: GeneratedFile[];
    packageName: string;
    componentCount: number;
}

/**
 * Convert Figma component name to a valid file/component name
 */
function toComponentFileName(figmaName: string): string {
    // "Button/LightMode" -> "Button"
    // "Accordion/Dark Mode" -> "Accordion"
    const baseName = figmaName.split('/')[0];
    return baseName
        .replace(/[^a-zA-Z0-9]/g, '')
        .replace(/^[a-z]/, (c) => c.toUpperCase());
}

/**
 * Convert Figma component name to a valid React component name
 */
function toReactComponentName(figmaName: string): string {
    const baseName = figmaName.split('/')[0];
    return baseName
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

/**
 * Group components by their base name (e.g., "Button/LightMode" and "Button/DarkMode" -> "Button")
 */
function groupComponentsByBase(components: Record<string, ComponentDefinition>): Map<string, ComponentDefinition[]> {
    const groups = new Map<string, ComponentDefinition[]>();

    for (const [name, def] of Object.entries(components)) {
        const baseName = toComponentFileName(name);
        if (!groups.has(baseName)) {
            groups.set(baseName, []);
        }
        groups.get(baseName)!.push({ ...def, name });
    }

    return groups;
}

/**
 * Merge properties from multiple variants into a unified props interface
 */
function mergeComponentProperties(variants: ComponentDefinition[]): Record<string, FigmaComponentProp> {
    const mergedProps: Record<string, FigmaComponentProp> = {};

    for (const variant of variants) {
        for (const [key, prop] of Object.entries(variant.properties)) {
            if (!mergedProps[key]) {
                mergedProps[key] = { ...prop };
            } else {
                // Merge options for VARIANT types
                if (prop.type === 'VARIANT' && prop.options) {
                    const existingOptions = mergedProps[key].options || [];
                    const newOptions = [...new Set([...existingOptions, ...prop.options])];
                    mergedProps[key].options = newOptions;
                }
            }
        }
    }

    // Add darkMode prop if we have both light and dark variants
    const hasLightMode = variants.some(v => v.name.toLowerCase().includes('light'));
    const hasDarkMode = variants.some(v => v.name.toLowerCase().includes('dark'));

    if (hasLightMode && hasDarkMode && !mergedProps['darkMode']) {
        mergedProps['darkMode'] = {
            name: 'darkMode',
            type: 'BOOLEAN',
            value: false,
            defaultValue: false,
        };
    }

    return mergedProps;
}

/**
 * Generate package.json content
 */
function generatePackageJson(config: PackageConfig, componentNames: string[]): string {
    const exports: Record<string, any> = {
        '.': {
            import: './dist/index.js',
            require: './dist/index.cjs',
            types: './dist/index.d.ts',
        },
    };

    // Add individual component exports
    for (const name of componentNames) {
        exports[`./${name}`] = {
            import: `./dist/components/${name}/index.js`,
            require: `./dist/components/${name}/index.cjs`,
            types: `./dist/components/${name}/index.d.ts`,
        };
    }

    return JSON.stringify({
        name: config.packageName,
        version: config.version,
        description: config.description,
        main: './dist/index.cjs',
        module: './dist/index.js',
        types: './dist/index.d.ts',
        exports,
        files: ['dist'],
        scripts: {
            build: 'tsup src/index.ts --format cjs,esm --dts',
            dev: 'tsup src/index.ts --format cjs,esm --dts --watch',
            lint: 'eslint src/',
            prepublishOnly: 'npm run build',
        },
        peerDependencies: {
            react: '>=17.0.0',
            'react-dom': '>=17.0.0',
        },
        devDependencies: {
            '@types/react': '^18.0.0',
            '@types/react-dom': '^18.0.0',
            'tsup': '^8.0.0',
            'typescript': '^5.0.0',
            'react': '^18.0.0',
            'react-dom': '^18.0.0',
        },
        author: config.author,
        license: config.license,
        keywords: ['react', 'components', 'ui', 'design-system', 'figma', 'uiforge'],
        repository: {
            type: 'git',
            url: '',
        },
    }, null, 2);
}

/**
 * Generate TypeScript config
 */
function generateTsConfig(): string {
    return JSON.stringify({
        compilerOptions: {
            target: 'ES2020',
            lib: ['ES2020', 'DOM', 'DOM.Iterable'],
            module: 'ESNext',
            moduleResolution: 'bundler',
            jsx: 'react-jsx',
            strict: true,
            declaration: true,
            declarationMap: true,
            sourceMap: true,
            outDir: './dist',
            rootDir: './src',
            skipLibCheck: true,
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            forceConsistentCasingInFileNames: true,
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: false,
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist'],
    }, null, 2);
}

/**
 * Generate theme file with design tokens
 */
function generateThemeFile(): string {
    return `/**
 * Design System Theme
 * Auto-generated by UI Forge from Figma design tokens
 */

export const colors = {
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#9c27b0',
    light: '#ba68c8',
    dark: '#7b1fa2',
    contrastText: '#ffffff',
  },
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100',
    contrastText: '#ffffff',
  },
  info: {
    main: '#0288d1',
    light: '#03a9f4',
    dark: '#01579b',
    contrastText: '#ffffff',
  },
  success: {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20',
    contrastText: '#ffffff',
  },
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
  background: {
    default: '#ffffff',
    paper: '#ffffff',
  },
  divider: 'rgba(0, 0, 0, 0.12)',
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
};

export const typography = {
  fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
  },
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const borderRadius = {
  none: '0',
  sm: '2px',
  md: '4px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};

export const theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
};

export type Theme = typeof theme;
export default theme;
`;
}

/**
 * Generate main index.ts that exports all components
 */
function generateIndexFile(componentNames: string[]): string {
    const imports = componentNames.map(name =>
        `export { ${name}, type ${name}Props } from './components/${name}';`
    ).join('\n');

    return `/**
 * Design System Components
 * Auto-generated by UI Forge
 */

// Theme and design tokens
export { theme, colors, spacing, typography, borderRadius, shadows } from './theme';
export type { Theme } from './theme';

// Components
${imports}
`;
}

/**
 * Generate README.md for the package
 */
function generateReadme(config: PackageConfig, componentNames: string[]): string {
    const componentList = componentNames.map(name => `- \`${name}\``).join('\n');

    return `# ${config.packageName}

${config.description}

## Installation

\`\`\`bash
npm install ${config.packageName}
\`\`\`

## Usage

\`\`\`tsx
import { Button, Accordion, Chip } from '${config.packageName}';

function App() {
  return (
    <div>
      <Button color="Primary" size="Large">
        Click me
      </Button>
    </div>
  );
}
\`\`\`

## Components

${componentList}

## Theme

You can import design tokens directly:

\`\`\`tsx
import { theme, colors, spacing } from '${config.packageName}';

const styles = {
  padding: spacing.md,
  color: colors.primary.main,
};
\`\`\`

## Generated with UI Forge

This component library was automatically generated from Figma designs using [UI Forge](https://uiforge.dev).

## License

${config.license}
`;
}

/**
 * Generate a complete npm package from Figma components
 */
export function generatePackage(
    components: Record<string, ComponentDefinition>,
    config: PackageConfig
): GeneratedPackage {
    const files: GeneratedFile[] = [];
    const groupedComponents = groupComponentsByBase(components);
    const componentNames: string[] = [];

    // Generate each component
    for (const [baseName, variants] of groupedComponents) {
        const componentName = toReactComponentName(baseName);
        componentNames.push(componentName);

        // Merge properties from all variants
        const mergedProps = mergeComponentProperties(variants);

        // Generate the component code
        const generated = generateComponentCode(baseName, mergedProps);

        // Component file (single index.tsx handles both component and exports)
        files.push({
            path: `src/components/${componentName}/index.tsx`,
            content: generated.componentCode,
        });
    }

    // Generate package files
    files.push({
        path: 'package.json',
        content: generatePackageJson(config, componentNames),
    });

    files.push({
        path: 'tsconfig.json',
        content: generateTsConfig(),
    });

    files.push({
        path: 'src/theme.ts',
        content: generateThemeFile(),
    });

    files.push({
        path: 'src/index.ts',
        content: generateIndexFile(componentNames),
    });

    files.push({
        path: 'README.md',
        content: generateReadme(config, componentNames),
    });

    // .gitignore
    files.push({
        path: '.gitignore',
        content: `node_modules/
dist/
.DS_Store
*.log
`,
    });

    // .npmignore
    files.push({
        path: '.npmignore',
        content: `src/
tsconfig.json
.gitignore
*.log
`,
    });

    return {
        files,
        packageName: config.packageName,
        componentCount: componentNames.length,
    };
}

export type { ComponentDefinition, PackageConfig, GeneratedFile, GeneratedPackage };
