import Anthropic from '@anthropic-ai/sdk';
import prettier from 'prettier';
import dotenv from 'dotenv';
import { createLLMGenerator } from './localLLM.js';

dotenv.config();

// Initialize LLM based on configuration
const llmProvider = process.env.LLM_PROVIDER || 'local'; // 'anthropic' or 'local'
let anthropic = null;
let localLLM = null;

if (llmProvider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
} else {
  // Use local LLM by default
  localLLM = createLLMGenerator();
}

/**
 * Generate React/Next.js component from Figma data using LLM
 */
export async function generateComponent(componentData, componentImage, config) {
  try {
    let generatedCode;

    if (llmProvider === 'anthropic' && anthropic) {
      // Use Anthropic Claude
      const prompt = buildPrompt(componentData, config);

      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4096,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      generatedCode = extractCode(response.content[0].text);
    } else {
      // Use local LLM
      console.log(`🤖 Using local LLM: ${process.env.LLM_MODEL || 'codellama:7b'}`);

      // Check if local LLM is available
      const isAvailable = await localLLM.checkAvailability();
      if (!isAvailable) {
        console.log('⏳ Local LLM not available, attempting to set up...');
        await localLLM.ensureOllamaModel();
      }

      // Generate component with local LLM
      const result = await localLLM.generateComponent(componentData, config);
      generatedCode = result;
    }

    // Format the code
    const formattedCode = await formatCode(generatedCode, config);

    // Generate additional files (tests, styles, types)
    const additionalFiles = await generateAdditionalFiles(
      componentData,
      generatedCode,
      config
    );

    return {
      component: formattedCode,
      ...additionalFiles
    };

  } catch (error) {
    console.error('Component generation error:', error);
    throw error;
  }
}

/**
 * Build prompt for Claude
 */
function buildPrompt(componentData, config) {
  const { componentName, framework, typescript, styling, includeTests } = config;

  let prompt = `Generate a production-ready ${framework} component based on this Figma design data.

Component Name: ${componentName}
Use TypeScript: ${typescript}
Styling Method: ${styling}
Include Tests: ${includeTests}

Figma Component Data:
${JSON.stringify(componentData, null, 2)}

Requirements:
1. Create a reusable, accessible component
2. Use semantic HTML elements
3. Include proper TypeScript types if enabled
4. Add comprehensive JSDoc comments
5. Make the component fully customizable via props
6. Follow React best practices and hooks patterns
7. Ensure the component is responsive
8. Add ARIA attributes for accessibility`;

  if (styling === 'shadcn') {
    prompt += `
9. Use shadcn/ui component library with Tailwind CSS
10. Import components from '@/components/ui' (e.g., Button, Card, etc.)
11. Use the cn() utility function for className merging from '@/lib/utils'
12. Override shadcn components with custom Tailwind classes as needed
13. Map Figma properties to shadcn component props (e.g., variant, size, etc.)
14. For properties not in Figma JSON, use sensible defaults from shadcn
15. Make the component composable using shadcn primitives`;
  } else if (styling === 'tailwind') {
    prompt += `
9. Use Tailwind CSS classes for styling
10. Use className prop for custom styling`;
  } else if (styling === 'styled-components') {
    prompt += `
9. Use styled-components for styling
10. Create themed components with props for variants`;
  } else if (styling === 'css-modules') {
    prompt += `
9. Use CSS modules for styling
10. Import styles from .module.css file`;
  }

  prompt += `

Generate the complete component code. Start the code with \`\`\`${typescript ? 'tsx' : 'jsx'} and end with \`\`\`.`;

  return prompt;
}

/**
 * Extract code from Claude's response
 */
function extractCode(response) {
  // Extract code between backticks
  const codeMatch = response.match(/```(?:tsx|jsx|typescript|javascript)?\n([\s\S]*?)\n```/);
  if (codeMatch) {
    return codeMatch[1];
  }

  // If no code block found, return the entire response
  return response;
}

/**
 * Format code using Prettier
 */
async function formatCode(code, config) {
  try {
    const formatted = await prettier.format(code, {
      parser: config.typescript ? 'typescript' : 'babel',
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'es5',
      printWidth: 80,
      bracketSpacing: true,
      arrowParens: 'always',
    });
    return formatted;
  } catch (error) {
    console.warn('Prettier formatting failed:', error);
    return code;
  }
}

/**
 * Generate additional files (tests, styles, types)
 */
async function generateAdditionalFiles(componentData, componentCode, config) {
  const files = {};

  // Generate TypeScript definitions
  if (config.typescript) {
    files.types = await generateTypeDefinitions(componentData, config);
  }

  // Generate test file
  if (config.includeTests) {
    files.test = await generateTestFile(componentCode, config);
  }

  // Generate styles
  if (config.styling === 'css-modules') {
    files.styles = await generateStyleFile(componentData, config);
  }

  // Generate Storybook story
  if (config.includeStorybook) {
    files.story = await generateStoryFile(componentCode, config);
  }

  // Generate README
  files.readme = generateReadme(config);

  // Generate package.json for the component
  files.packageJson = generatePackageJson(config);

  return files;
}

/**
 * Generate TypeScript type definitions
 */
async function generateTypeDefinitions(componentData, config) {
  // Skip type generation for local LLM - use simple default types
  // Local LLM will include types in the component itself
  console.log('Using default TypeScript types (local LLM includes types in component)');

  return `export interface ${config.componentName}Props {
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}`;
}

/**
 * Generate test file
 */
async function generateTestFile(componentCode, config) {
  const testTemplate = `import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ${config.componentName} } from './${config.componentName}';

describe('${config.componentName}', () => {
  it('renders without crashing', () => {
    render(<${config.componentName} />);
  });

  it('accepts className prop', () => {
    const { container } = render(
      <${config.componentName} className="test-class" />
    );
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('renders children', () => {
    render(
      <${config.componentName}>
        <span>Test Content</span>
      </${config.componentName}>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});`;

  return testTemplate;
}

/**
 * Generate CSS module file
 */
async function generateStyleFile(componentData, config) {
  // Extract style information from Figma data
  const styles = extractStylesFromFigmaData(componentData);

  let cssContent = `.${config.componentName.toLowerCase()} {
  /* Component styles */
  display: flex;
  position: relative;\n`;

  // Add extracted styles
  if (styles.backgroundColor) {
    cssContent += `  background-color: ${styles.backgroundColor};\n`;
  }
  if (styles.padding) {
    cssContent += `  padding: ${styles.padding};\n`;
  }
  if (styles.borderRadius) {
    cssContent += `  border-radius: ${styles.borderRadius};\n`;
  }

  cssContent += `}\n\n/* Add more styles as needed */`;

  return cssContent;
}

/**
 * Extract styles from Figma data
 */
function extractStylesFromFigmaData(componentData) {
  const styles = {};

  if (componentData.fills && componentData.fills.length > 0) {
    const fill = componentData.fills[0];
    if (fill.type === 'SOLID' && fill.color) {
      const { r, g, b, a } = fill.color;
      styles.backgroundColor = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
    }
  }

  if (componentData.paddingLeft !== undefined) {
    styles.padding = `${componentData.paddingTop || 0}px ${componentData.paddingRight || 0}px ${componentData.paddingBottom || 0}px ${componentData.paddingLeft || 0}px`;
  }

  if (componentData.cornerRadius !== undefined) {
    styles.borderRadius = `${componentData.cornerRadius}px`;
  }

  return styles;
}

/**
 * Generate Storybook story file
 */
function generateStoryFile(componentCode, config) {
  return `import type { Meta, StoryObj } from '@storybook/react';
import { ${config.componentName} } from './${config.componentName}';

const meta: Meta<typeof ${config.componentName}> = {
  title: 'Components/${config.componentName}',
  component: ${config.componentName},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCustomClass: Story = {
  args: {
    className: 'custom-class',
  },
};`;
}

/**
 * Generate README for the component
 */
function generateReadme(config) {
  return `# ${config.componentName}

A reusable React component generated from Figma design.

## Installation

\`\`\`bash
npm install ${config.packageScope}/${config.componentName.toLowerCase()}
\`\`\`

## Usage

\`\`\`${config.typescript ? 'tsx' : 'jsx'}
import { ${config.componentName} } from '${config.packageScope}/${config.componentName.toLowerCase()}';

function App() {
  return (
    <${config.componentName}>
      Your content here
    </${config.componentName}>
  );
}
\`\`\`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| className | string | - | Additional CSS classes |
| children | ReactNode | - | Child elements |

## License

MIT`;
}

/**
 * Generate package.json for the component
 */
function generatePackageJson(config) {
  const packageName = `${config.packageScope}/${config.componentName.toLowerCase()}`;

  return {
    name: packageName,
    version: '1.0.0',
    description: `${config.componentName} React component`,
    main: 'dist/index.js',
    module: 'dist/index.esm.js',
    types: 'dist/index.d.ts',
    files: ['dist', 'README.md'],
    scripts: {
      build: 'rollup -c',
      test: 'jest',
      prepublishOnly: 'npm run build'
    },
    peerDependencies: {
      react: '>=16.8.0',
      'react-dom': '>=16.8.0'
    },
    devDependencies: {
      '@types/react': '^18.0.0',
      '@types/react-dom': '^18.0.0',
      'rollup': '^4.0.0',
      'typescript': '^5.0.0',
      'jest': '^29.0.0',
      '@testing-library/react': '^14.0.0'
    },
    keywords: ['react', 'component', 'ui', config.componentName.toLowerCase()],
    author: 'UIForge',
    license: 'MIT',
    repository: {
      type: 'git',
      url: `https://github.com/uiforge/components`
    }
  };
}

export { generateTypeDefinitions, generateTestFile, generateStyleFile };