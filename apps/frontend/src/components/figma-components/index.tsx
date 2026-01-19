'use client';
import React from 'react';
import { FigmaAccordion } from './FigmaAccordion';
import { FigmaButton } from './FigmaButton';
import { FigmaBreadcrumb } from './FigmaBreadcrumb';
import { FigmaDropdown } from './FigmaDropdown';
import { FigmaProgressBar } from './FigmaProgressBar';

// Component registry - maps Figma component names to React components
export const COMPONENT_REGISTRY: Record<string, {
    component: React.ComponentType<any>;
    defaultProps: Record<string, any>;
    nodeId: string;
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
    // Breadcrumb component
    'Breadcrumb': {
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
        nodeId: 'breadcrumb',
    },
    // Dropdown component
    'Dropdown': {
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
        nodeId: 'dropdown',
    },
    // Progress component
    'Progress': {
        component: FigmaProgressBar,
        defaultProps: {
            value: 60,
            label: 'Progress',
            showLabel: true,
            showPercentage: true,
            darkMode: false,
            color: 'primary',
        },
        nodeId: 'progress',
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
