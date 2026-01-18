'use client';
import React from 'react';
import { FigmaAccordionDarkMode } from './FigmaAccordionDarkMode';
import { FigmaButton } from './FigmaButton';

// Component registry - maps Figma component names to React components
export const COMPONENT_REGISTRY: Record<string, {
    component: React.ComponentType<any>;
    defaultProps: Record<string, any>;
    nodeId: string;
}> = {
    'Accordion/DarkMode': {
        component: FigmaAccordionDarkMode,
        defaultProps: {
            heading: 'Heading',
            secondaryHeading: 'Secondary heading',
        },
        nodeId: '1:46',
    },
    'Accordion/LightMode': {
        component: FigmaAccordionDarkMode, // Same component, light mode is default
        defaultProps: {
            heading: 'Heading',
            secondaryHeading: 'Secondary heading',
        },
        nodeId: '1:136',
    },
    'Button/LightMode': {
        component: FigmaButton,
        defaultProps: {
            label: 'Button',
            darkMode: false,
            showLeftIcon: true,
            showRightIcon: true,
        },
        nodeId: '14:3737',
    },
    'Button/DarkMode': {
        component: FigmaButton,
        defaultProps: {
            label: 'Button',
            darkMode: true,
            showLeftIcon: true,
            showRightIcon: true,
        },
        nodeId: '14:3738',
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

export { FigmaAccordionDarkMode } from './FigmaAccordionDarkMode';
export { FigmaButton } from './FigmaButton';
