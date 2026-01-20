/**
 * CodeGenerator Service
 *
 * Generates production-ready React component code from Figma component properties.
 * Uses a unified component approach where a single component handles all variants via props.
 */

interface FigmaComponentProp {
    name: string;
    type: 'BOOLEAN' | 'VARIANT' | 'TEXT' | 'INSTANCE_SWAP';
    value: boolean | string;
    options?: string[];
    defaultValue?: boolean | string;
}

interface GeneratedCode {
    componentCode: string;
    usageExample: string;
    propsInterface: string;
}

/**
 * Convert Figma component name to a valid React component name
 * e.g., "Button/LightMode" -> "Button"
 */
function toComponentName(figmaName: string): string {
    // Extract base name (before any slash)
    const baseName = figmaName.split('/')[0];
    // Convert to PascalCase and remove special characters
    return baseName
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

/**
 * Convert property name to camelCase
 */
function toCamelCase(str: string): string {
    return str
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((word, index) =>
            index === 0
                ? word.toLowerCase()
                : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join('');
}

/**
 * Deduplicate properties with same name but different types
 * Appends type suffix to make names unique
 */
function deduplicateProps(props: Record<string, FigmaComponentProp>): Record<string, FigmaComponentProp> {
    const seenNames = new Map<string, number>();
    const result: Record<string, FigmaComponentProp> = {};

    for (const [key, prop] of Object.entries(props)) {
        const baseName = toCamelCase(key);

        if (seenNames.has(baseName)) {
            // Duplicate found - append type suffix
            const count = seenNames.get(baseName)! + 1;
            seenNames.set(baseName, count);

            // Create unique name based on type
            let uniqueName: string;
            if (prop.type === 'BOOLEAN') {
                uniqueName = `${key}Enabled`;
            } else if (prop.type === 'TEXT') {
                uniqueName = `${key}Text`;
            } else if (prop.type === 'VARIANT') {
                uniqueName = `${key}Variant`;
            } else {
                uniqueName = `${key}${count}`;
            }

            result[uniqueName] = { ...prop, name: uniqueName };
        } else {
            seenNames.set(baseName, 1);
            result[key] = prop;
        }
    }

    return result;
}

/**
 * Generate TypeScript type for a property
 */
function generatePropType(prop: FigmaComponentProp): string {
    switch (prop.type) {
        case 'BOOLEAN':
            return 'boolean';
        case 'VARIANT':
            if (prop.options && prop.options.length > 0) {
                return prop.options.map(opt => `'${opt}'`).join(' | ');
            }
            return 'string';
        case 'TEXT':
            return 'string';
        case 'INSTANCE_SWAP':
            return 'React.ReactNode';
        default:
            return 'any';
    }
}

/**
 * Generate default value string for a property
 */
function generateDefaultValue(prop: FigmaComponentProp): string {
    const value = prop.value ?? prop.defaultValue;
    if (prop.type === 'BOOLEAN') {
        return String(value);
    }
    if (typeof value === 'string') {
        return `'${value}'`;
    }
    return String(value);
}

/**
 * Generate the props interface for the component
 */
function generatePropsInterface(
    componentName: string,
    props: Record<string, FigmaComponentProp>
): string {
    const propsEntries = Object.entries(props);
    if (propsEntries.length === 0) {
        return `interface ${componentName}Props {\n  children?: React.ReactNode;\n}`;
    }

    const propLines = propsEntries.map(([key, prop]) => {
        const propName = toCamelCase(key);
        const propType = generatePropType(prop);
        const isOptional = prop.defaultValue !== undefined || prop.value !== undefined;
        return `  /** ${prop.type} property */\n  ${propName}${isOptional ? '?' : ''}: ${propType};`;
    });

    return `export interface ${componentName}Props {\n${propLines.join('\n')}\n  children?: React.ReactNode;\n}`;
}

/**
 * Generate style object based on component properties
 * Note: This generates a simple placeholder - customize based on your design tokens
 */
function generateStyleLogic(): string {
    return `  // Add your styling logic here based on props
  // This is a placeholder - customize based on your design system`;
}

/**
 * Generate the main component code
 */
export function generateComponentCode(
    componentName: string,
    figmaProps: Record<string, FigmaComponentProp>
): GeneratedCode {
    const reactComponentName = toComponentName(componentName);

    // Deduplicate properties with same name but different types
    const dedupedProps = deduplicateProps(figmaProps);

    const propsInterface = generatePropsInterface(reactComponentName, dedupedProps);

    // Generate prop destructuring with defaults
    const propEntries = Object.entries(dedupedProps);
    const propsDestructure = propEntries.length > 0
        ? propEntries
            .map(([key, prop]) => {
                const propName = toCamelCase(key);
                const defaultVal = generateDefaultValue(prop);
                return `  ${propName} = ${defaultVal}`;
            })
            .join(',\n')
        : '';

    // Generate style logic (placeholder for customization)
    const styleLogic = generateStyleLogic();

    // Generate component code
    const componentCode = `'use client';

import React from 'react';

${propsInterface}

/**
 * ${reactComponentName} Component
 *
 * Auto-generated from Figma design.
 * Supports all variant properties through props.
 */
export function ${reactComponentName}({
${propsDestructure}${propsDestructure ? ',' : ''}
  children,
}: ${reactComponentName}Props) {
${styleLogic}

  return (
    <div className="flex items-center justify-center">
      {children}
    </div>
  );
}

export default ${reactComponentName};
`;

    // Generate usage example
    const usageProps = propEntries
        .map(([key, prop]) => {
            const propName = toCamelCase(key);
            const value = prop.value ?? prop.defaultValue;
            if (prop.type === 'BOOLEAN') {
                return value ? propName : `${propName}={false}`;
            }
            return `${propName}="${value}"`;
        })
        .join('\n      ');

    const usageExample = `// Basic usage
<${reactComponentName}
  ${usageProps}
>
  Click me
</${reactComponentName}>

// With different variants
<${reactComponentName}
  ${propEntries.filter(([_, p]) => p.type === 'VARIANT').map(([key, prop]) => {
      const propName = toCamelCase(key);
      const alternateValue = prop.options?.[1] || prop.value;
      return `${propName}="${alternateValue}"`;
  }).join('\n  ')}
>
  Alternative
</${reactComponentName}>`;

    return {
        componentCode,
        usageExample,
        propsInterface,
    };
}

/**
 * Generate simple inline code for quick preview
 */
export function generateInlineCode(
    componentName: string,
    figmaProps: Record<string, FigmaComponentProp>
): string {
    const reactComponentName = toComponentName(componentName);
    const propEntries = Object.entries(figmaProps);

    if (propEntries.length === 0) {
        return `<${reactComponentName}>Content</${reactComponentName}>`;
    }

    const propsString = propEntries
        .map(([key, prop]) => {
            const propName = toCamelCase(key);
            const value = prop.value ?? prop.defaultValue;
            if (prop.type === 'BOOLEAN') {
                return value ? propName : `${propName}={false}`;
            }
            return `${propName}="${value}"`;
        })
        .join(' ');

    return `<${reactComponentName} ${propsString}>Content</${reactComponentName}>`;
}

export type { FigmaComponentProp, GeneratedCode };
