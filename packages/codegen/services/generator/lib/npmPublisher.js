import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Publish component to npm registry
 */
export async function publishToNpm({ component, packageName, version, registry }) {
  const tempDir = path.join(__dirname, '..', 'temp', Date.now().toString());
  let success = false;

  try {
    // Create temporary directory
    await fs.ensureDir(tempDir);

    // Sanitize package name - remove invalid characters and extra slashes
    // Always use @uiforge-admin scope for now
    let finalPackageName;

    // Extract component name from the package name
    let componentName = packageName
      .replace(/@[^/]+\//, '') // Remove scope if present
      .replace(/\//g, '-')      // Replace slashes with hyphens
      .replace(/-+/g, '-')      // Replace multiple hyphens with single
      .toLowerCase()
      .trim();

    // Ensure we have a valid component name
    if (!componentName) {
      componentName = 'component';
    }

    // Always use @uiforge-admin scope (the npm username)
    finalPackageName = `@uiforge-admin/${componentName}`;

    // Parse package name to get scope and component name parts
    const [scope, componentNamePart] = finalPackageName.split('/');
    const packageDir = path.join(tempDir, componentName);
    await fs.ensureDir(packageDir);

    console.log(`📦 Original package name: ${packageName}`);
    console.log(`📦 Sanitized package name: ${finalPackageName}`);

    // Write package files (use sanitized name)
    await writePackageFiles(packageDir, component, finalPackageName, version);

    // Build the package
    await buildPackage(packageDir);

    // Publish to npm (or local registry for testing)
    const publishResult = await publishPackage(packageDir, registry);

    success = true;
    return {
      success: true,
      package: finalPackageName,
      version,
      url: `https://www.npmjs.com/package/${finalPackageName}`,
      ...publishResult
    };

  } catch (error) {
    console.error('NPM publish error:', error);
    console.error('Temp directory preserved for debugging:', tempDir);
    throw error;
  } finally {
    // Clean up temp directory only on success
    if (success) {
      await fs.remove(tempDir);
    }
  }
}

/**
 * Write package files to directory
 */
async function writePackageFiles(packageDir, component, packageName, version) {
  // Write component file
  const srcDir = path.join(packageDir, 'src');
  await fs.ensureDir(srcDir);

  // Extract component name from package name
  const componentName = packageName.split('/')[1];
  const componentFileName = `${componentName}.${component.component.includes('interface') ? 'tsx' : 'jsx'}`;

  // Write main component
  await fs.writeFile(
    path.join(srcDir, componentFileName),
    component.component
  );

  // Write index file that exports the component
  const indexContent = `export { default as ${capitalizeFirst(componentName)} } from './src/${componentName}';
export * from './src/${componentName}';`;
  await fs.writeFile(path.join(packageDir, 'index.js'), indexContent);

  // Write TypeScript definitions if provided
  if (component.types) {
    await fs.writeFile(
      path.join(srcDir, `${componentName}.d.ts`),
      component.types
    );
  }

  // Write test file if provided
  if (component.test) {
    await fs.writeFile(
      path.join(srcDir, `${componentName}.test.${component.types ? 'tsx' : 'jsx'}`),
      component.test
    );
  }

  // Write styles if provided
  if (component.styles) {
    await fs.writeFile(
      path.join(srcDir, `${componentName}.module.css`),
      component.styles
    );
  }

  // Write README
  if (component.readme) {
    await fs.writeFile(
      path.join(packageDir, 'README.md'),
      component.readme
    );
  }

  // Write package.json - always use our default that has the correct dependencies
  // Don't use component.packageJson as it lacks the build dependencies
  const packageJson = createDefaultPackageJson(packageName, version);
  await fs.writeFile(
    path.join(packageDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Determine if using TypeScript
  const isTypeScript = componentFileName.endsWith('.tsx') || componentFileName.endsWith('.ts');

  // Write build configuration (rollup.config.js)
  await writeRollupConfig(packageDir, componentName, componentFileName);

  // Write TypeScript config if needed
  if (isTypeScript) {
    await writeTsConfig(packageDir);
  }
}

/**
 * Create default package.json if not provided
 */
function createDefaultPackageJson(packageName, version) {
  return {
    name: packageName,
    version: version,
    description: `React component ${packageName}`,
    main: 'dist/index.js',
    module: 'dist/index.esm.js',
    types: 'dist/index.d.ts',
    files: ['dist', 'README.md'],
    scripts: {
      build: 'rollup -c',
      test: 'jest'
    },
    peerDependencies: {
      react: '>=16.8.0',
      'react-dom': '>=16.8.0'
    },
    devDependencies: {
      '@rollup/plugin-commonjs': '^25.0.0',
      '@rollup/plugin-node-resolve': '^15.0.0',
      '@rollup/plugin-typescript': '^11.0.0',
      '@rollup/plugin-babel': '^6.0.0',
      '@rollup/plugin-terser': '^0.4.4',
      '@babel/core': '^7.23.0',
      '@babel/preset-react': '^7.23.0',
      'rollup': '^4.0.0',
      'typescript': '^5.0.0',
      'tslib': '^2.6.0'
    },
    keywords: ['react', 'component', 'ui'],
    author: 'UIForge',
    license: 'MIT',
    publishConfig: {
      access: 'public'
    }
  };
}

/**
 * Write Rollup configuration
 */
async function writeRollupConfig(packageDir, componentName, componentFileName) {
  const isTypeScript = componentFileName.endsWith('.tsx') || componentFileName.endsWith('.ts');

  // Use @rollup/plugin-babel for JSX if not TypeScript
  const plugins = isTypeScript
    ? `    typescript({ tsconfig: './tsconfig.json' }),`
    : `    babel({
      babelHelpers: 'bundled',
      presets: ['@babel/preset-react'],
      extensions: ['.js', '.jsx']
    }),`;

  // Use CommonJS (require) instead of ES modules to avoid module resolution issues
  const config = `const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
${isTypeScript ? "const typescript = require('@rollup/plugin-typescript');" : "const babel = require('@rollup/plugin-babel');"}
const terser = require('@rollup/plugin-terser');

module.exports = {
  input: 'src/${componentFileName}',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'auto'
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  external: ['react', 'react-dom'],
  plugins: [
    resolve.default ? resolve.default() : resolve(),
    commonjs.default ? commonjs.default() : commonjs(),
${plugins}
    terser.default ? terser.default() : terser()
  ]
};`;

  await fs.writeFile(path.join(packageDir, 'rollup.config.js'), config);
}

/**
 * Write TypeScript configuration
 */
async function writeTsConfig(packageDir) {
  const tsConfig = {
    compilerOptions: {
      target: 'es5',
      module: 'esnext',
      lib: ['dom', 'esnext'],
      jsx: 'react',
      declaration: true,
      declarationDir: 'dist',
      outDir: 'dist',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      moduleResolution: 'node'
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist', '**/*.test.*']
  };

  await fs.writeFile(
    path.join(packageDir, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  );
}

/**
 * Build the package
 */
async function buildPackage(packageDir) {
  try {
    // Install dependencies
    console.log('Installing dependencies...');
    const installOutput = execSync('npm install', {
      cwd: packageDir,
      encoding: 'utf8'
    });
    console.log('Install output:', installOutput);

    // Build the package
    console.log('Building package...');
    const buildOutput = execSync('npm run build', {
      cwd: packageDir,
      encoding: 'utf8'
    });
    console.log('Build output:', buildOutput);

  } catch (error) {
    console.error('Build error details:', {
      message: error.message,
      stdout: error.stdout?.toString(),
      stderr: error.stderr?.toString(),
      status: error.status
    });
    throw new Error(`Failed to build package: ${error.message}\nStderr: ${error.stderr}`);
  }
}

/**
 * Publish package to npm
 */
async function publishPackage(packageDir, registry) {
  try {
    // Use default registry if not provided
    const npmRegistry = registry || process.env.NPM_REGISTRY || 'https://registry.npmjs.org';

    console.log('📦 Package ready for publishing');
    console.log(`   Directory: ${packageDir}`);
    console.log(`   Registry: ${npmRegistry}`);

    // Check if we have npm auth token
    const npmToken = process.env.NPM_TOKEN;
    if (!npmToken) {
      console.warn('⚠️  NPM_TOKEN not set. Skipping actual publish.');
      return {
        published: false,
        message: 'Package prepared but not published (no NPM_TOKEN)'
      };
    }

    // Create .npmrc with auth token
    const npmrcContent = `//${npmRegistry.replace('https://', '')}/:_authToken=${npmToken}`;
    await fs.writeFile(path.join(packageDir, '.npmrc'), npmrcContent);

    // Publish the package
    console.log('Publishing to npm...');
    const output = execSync('npm publish --access public', {
      cwd: packageDir,
      encoding: 'utf8'
    });

    console.log('✅ Package published successfully');
    console.log(output);

    return {
      published: true,
      output
    };

  } catch (error) {
    console.error('Publish error:', error);

    // If publish fails, return the prepared package location
    return {
      published: false,
      message: `Package prepared at ${packageDir} but publish failed: ${error.message}`,
      packageDir
    };
  }
}

/**
 * Utility function to capitalize first letter
 */
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export { createDefaultPackageJson, writeRollupConfig, writeTsConfig };