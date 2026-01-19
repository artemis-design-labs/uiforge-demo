'use client';
import React from 'react';
import { FigmaAccordion } from './FigmaAccordion';
import { FigmaButton } from './FigmaButton';
import { FigmaBreadcrumb } from './FigmaBreadcrumb';
import { FigmaDropdown } from './FigmaDropdown';
import { FigmaProgressBar } from './FigmaProgressBar';

// Figma property definition type
export interface FigmaPropertyDefinition {
    name: string;
    type: 'BOOLEAN' | 'VARIANT' | 'TEXT';
    defaultValue: boolean | string;
    options?: string[]; // For VARIANT type
}

// Component registry - maps Figma component names to React components
export const COMPONENT_REGISTRY: Record<string, {
    component: React.ComponentType<any>;
    defaultProps: Record<string, any>;
    nodeId: string;
    figmaProperties?: FigmaPropertyDefinition[];
}> = {
    // Accordion components
    'Accordion/DarkMode': {
        component: FigmaAccordion,
        defaultProps: {
            heading: 'Heading',
            secondaryHeading: 'Secondary heading',
            content: 'This is the accordion content that appears when expanded.',
            expanded: false,
            disabled: false,
            darkMode: true, // Dark background, light text
        },
        nodeId: '1:45',
    },
    'Accordion/LightMode': {
        component: FigmaAccordion,
        defaultProps: {
            heading: 'Heading',
            secondaryHeading: 'Secondary heading',
            content: 'This is the accordion content that appears when expanded.',
            expanded: false,
            disabled: false,
            darkMode: false, // White background, dark text
        },
        nodeId: '1:135',
    },
    // Button components
    'Button/LightMode': {
        component: FigmaButton,
        defaultProps: {
            label: 'Button',
            darkMode: false, // Blue background, white text
            showLeftIcon: true,
            showRightIcon: true,
        },
        nodeId: '14:3737',
    },
    'Button/DarkMode': {
        component: FigmaButton,
        defaultProps: {
            label: 'Button',
            darkMode: true, // Light blue background, dark text
            showLeftIcon: true,
            showRightIcon: true,
        },
        nodeId: '14:3738',
    },
    // Breadcrumb components (note: space before "Mode" in Figma names)
    'Breadcrumb/Dark Mode': {
        component: FigmaBreadcrumb,
        defaultProps: {
            items: [
                { label: 'Home', href: '/' },
                { label: 'Products', href: '/products' },
                { label: 'Category', href: '/category' },
                { label: 'Current Page' },
            ],
            showHomeIcon: true,
            darkMode: true,
        },
        nodeId: '15:2303',
    },
    'Breadcrumb/Light Mode': {
        component: FigmaBreadcrumb,
        defaultProps: {
            items: [
                { label: 'Home', href: '/' },
                { label: 'Products', href: '/products' },
                { label: 'Category', href: '/category' },
                { label: 'Current Page' },
            ],
            showHomeIcon: true,
            darkMode: false,
        },
        nodeId: '15:2304',
    },
    // Dropdown component
    'Dropdown/LightMode': {
        component: FigmaDropdown,
        defaultProps: {
            label: 'Label',
            placeholder: 'Select an option',
            options: [
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' },
                { value: 'option3', label: 'Option 3' },
            ],
            darkMode: false,
            expanded: false,
        },
        nodeId: '15:5690',
    },
    // Progress component
    'ProgressLinear/LightMode': {
        component: FigmaProgressBar,
        defaultProps: {
            number: true,
            color: 'Primary',
            small: 'False',
            value: 25,
            darkMode: false,
        },
        nodeId: '15:5698',
        figmaProperties: [
            {
                name: 'number',
                type: 'BOOLEAN',
                defaultValue: true,
            },
            {
                name: 'color',
                type: 'VARIANT',
                defaultValue: 'Primary',
                options: ['Primary'],
            },
            {
                name: 'small',
                type: 'VARIANT',
                defaultValue: 'False',
                options: ['False', 'True'],
            },
        ],
    },
};

// Get component by name
export function getComponentByName(name: string) {
    return COMPONENT_REGISTRY[name] || null;
}

// Check if component is supported
export function isComponentSupported(name: string): boolean {
    return name in COMPONENT_REGISTRY;
}

// Get all supported component names
export function getSupportedComponentNames(): string[] {
    return Object.keys(COMPONENT_REGISTRY);
}

// Get Figma properties for a component
export function getFigmaProperties(name: string): FigmaPropertyDefinition[] | null {
    console.log('🔎 getFigmaProperties called with:', name);
    console.log('🔎 Available registry keys:', Object.keys(COMPONENT_REGISTRY));
    const registration = COMPONENT_REGISTRY[name];
    console.log('🔎 Registration found:', !!registration, registration?.figmaProperties ? 'has props' : 'no props');
    return registration?.figmaProperties || null;
}

// Dynamic component renderer
interface ComponentRendererProps {
    componentName: string;
    props?: Record<string, any>;
}

export function ComponentRenderer({ componentName, props = {} }: ComponentRendererProps) {
    const registration = getComponentByName(componentName);

    if (!registration) {
        return (
            <div className="text-center p-8">
                <p className="text-muted-foreground mb-2">Component: {componentName}</p>
                <p className="text-sm text-muted-foreground">
                    React rendering for this component is not yet implemented.
                </p>
            </div>
        );
    }

    const Component = registration.component;
    const mergedProps = { ...registration.defaultProps, ...props };

    return (
        <div className="flex flex-col items-center gap-4">
            <Component {...mergedProps} />
            <div className="text-xs text-muted-foreground text-center mt-2">
                <p>Component: {componentName}</p>
                <p className="opacity-60">Generated from Figma Node ID: {registration.nodeId}</p>
            </div>
        </div>
    );
}

export { FigmaAccordion } from './FigmaAccordion';
export { FigmaButton } from './FigmaButton';
export { FigmaBreadcrumb } from './FigmaBreadcrumb';
export { FigmaDropdown } from './FigmaDropdown';
export { FigmaProgressBar } from './FigmaProgressBar';
