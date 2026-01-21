'use client';
import React from 'react';
import { FigmaAccordion } from './FigmaAccordion';
import { FigmaAlert } from './FigmaAlert';
import { FigmaAvatar } from './FigmaAvatar';
import { FigmaBadge } from './FigmaBadge';
import { FigmaButton } from './FigmaButton';
import { FigmaBreadcrumb } from './FigmaBreadcrumb';
import { FigmaCheckbox } from './FigmaCheckbox';
import { FigmaChip } from './FigmaChip';
import { FigmaDropdown } from './FigmaDropdown';
import { FigmaProgressBar } from './FigmaProgressBar';
import { AVAILABLE_ICONS } from './FigmaIcons';

// Figma property definition type
export interface FigmaPropertyDefinition {
    name: string;
    type: 'BOOLEAN' | 'VARIANT' | 'TEXT' | 'INSTANCE_SWAP';
    defaultValue: boolean | string;
    options?: string[]; // For VARIANT type
    preferredValues?: Array<{ type: string; key: string }>; // For INSTANCE_SWAP type
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
            showSecondaryHeading: true,
            darkMode: true, // Dark background, light text
        },
        nodeId: '1:45',
        figmaProperties: [
            {
                name: 'expanded',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            {
                name: 'disabled',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            {
                name: 'showSecondaryHeading',
                type: 'BOOLEAN',
                defaultValue: true,
            },
        ],
    },
    'Accordion/LightMode': {
        component: FigmaAccordion,
        defaultProps: {
            heading: 'Heading',
            secondaryHeading: 'Secondary heading',
            content: 'This is the accordion content that appears when expanded.',
            expanded: false,
            disabled: false,
            showSecondaryHeading: true,
            darkMode: false, // White background, dark text
        },
        nodeId: '1:135',
        figmaProperties: [
            {
                name: 'expanded',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            {
                name: 'disabled',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            {
                name: 'showSecondaryHeading',
                type: 'BOOLEAN',
                defaultValue: true,
            },
        ],
    },
    // Button components - all 9 Figma properties
    // Properties: Size, Color, State, Type (VARIANT), Text (TEXT), Icon left, Icon right (BOOLEAN), Left Icon, Right icon (INSTANCE_SWAP)
    'Button/LightMode': {
        component: FigmaButton,
        defaultProps: {
            label: 'Button',
            darkMode: false,
            showLeftIcon: true,
            showRightIcon: true,
            leftIcon: 'ArrowLeft',
            rightIcon: 'ArrowRight',
            size: 'Large',
            color: 'Primary',
            state: 'Enabled',
            type: 'Contained',
        },
        nodeId: '14:3737',
        figmaProperties: [
            // TEXT property
            {
                name: 'Text',
                type: 'TEXT',
                defaultValue: 'Button',
            },
            // BOOLEAN properties
            {
                name: 'Icon left',
                type: 'BOOLEAN',
                defaultValue: true,
            },
            {
                name: 'Icon right',
                type: 'BOOLEAN',
                defaultValue: true,
            },
            // INSTANCE_SWAP properties - now with options from icon library
            {
                name: 'Left Icon',
                type: 'INSTANCE_SWAP',
                defaultValue: 'ArrowLeft',
                options: AVAILABLE_ICONS,
            },
            {
                name: 'Right Icon',
                type: 'INSTANCE_SWAP',
                defaultValue: 'ArrowRight',
                options: AVAILABLE_ICONS,
            },
            // VARIANT properties
            {
                name: 'Size',
                type: 'VARIANT',
                defaultValue: 'Large',
                options: ['Small', 'Medium', 'Large'],
            },
            {
                name: 'Color',
                type: 'VARIANT',
                defaultValue: 'Primary',
                options: ['Primary', 'Secondary', 'Error', 'Warning', 'Info', 'Success', 'Disabled'],
            },
            {
                name: 'State',
                type: 'VARIANT',
                defaultValue: 'Enabled',
                options: ['Enabled', 'Hovered', 'Focused', 'Disabled'],
            },
            {
                name: 'Type',
                type: 'VARIANT',
                defaultValue: 'Contained',
                options: ['Contained', 'Outlined', 'Text'],
            },
        ],
    },
    'Button/DarkMode': {
        component: FigmaButton,
        defaultProps: {
            label: 'Button',
            darkMode: true,
            showLeftIcon: true,
            showRightIcon: true,
            leftIcon: 'ArrowLeft',
            rightIcon: 'ArrowRight',
            size: 'Large',
            color: 'Primary',
            state: 'Enabled',
            type: 'Contained',
        },
        nodeId: '14:3738',
        figmaProperties: [
            // TEXT property
            {
                name: 'Text',
                type: 'TEXT',
                defaultValue: 'Button',
            },
            // BOOLEAN properties
            {
                name: 'Icon left',
                type: 'BOOLEAN',
                defaultValue: true,
            },
            {
                name: 'Icon right',
                type: 'BOOLEAN',
                defaultValue: true,
            },
            // INSTANCE_SWAP properties - now with options from icon library
            {
                name: 'Left Icon',
                type: 'INSTANCE_SWAP',
                defaultValue: 'ArrowLeft',
                options: AVAILABLE_ICONS,
            },
            {
                name: 'Right Icon',
                type: 'INSTANCE_SWAP',
                defaultValue: 'ArrowRight',
                options: AVAILABLE_ICONS,
            },
            // VARIANT properties
            {
                name: 'Size',
                type: 'VARIANT',
                defaultValue: 'Large',
                options: ['Small', 'Medium', 'Large'],
            },
            {
                name: 'Color',
                type: 'VARIANT',
                defaultValue: 'Primary',
                options: ['Primary', 'Secondary', 'Error', 'Warning', 'Info', 'Success', 'Disabled'],
            },
            {
                name: 'State',
                type: 'VARIANT',
                defaultValue: 'Enabled',
                options: ['Enabled', 'Hovered', 'Focused', 'Disabled'],
            },
            {
                name: 'Type',
                type: 'VARIANT',
                defaultValue: 'Contained',
                options: ['Contained', 'Outlined', 'Text'],
            },
        ],
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
        figmaProperties: [
            {
                name: 'showHomeIcon',
                type: 'BOOLEAN',
                defaultValue: true,
            },
        ],
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
        figmaProperties: [
            {
                name: 'showHomeIcon',
                type: 'BOOLEAN',
                defaultValue: true,
            },
        ],
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
            showIcon: true,
            showHelperText: true,
        },
        nodeId: '15:5690',
        figmaProperties: [
            {
                name: 'showIcon',
                type: 'BOOLEAN',
                defaultValue: true,
            },
            {
                name: 'showHelperText',
                type: 'BOOLEAN',
                defaultValue: true,
            },
            {
                name: 'state',
                type: 'VARIANT',
                defaultValue: 'Enabled',
                options: ['Enabled', 'Hovered', 'Focused'],
            },
        ],
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
                options: ['Primary', 'Secondary', 'Error', 'Warning', 'Info', 'Success'],
            },
            {
                name: 'small',
                type: 'VARIANT',
                defaultValue: 'False',
                options: ['False', 'True'],
            },
        ],
    },
    // Alert components
    'Alert/LightMode': {
        component: FigmaAlert,
        defaultProps: {
            title: 'Alert Title',
            description: 'This is an alert description that provides more details.',
            severity: 'Info',
            variant: 'Standard',
            showIcon: true,
            showClose: true,
            showTitle: true,
            darkMode: false,
        },
        nodeId: 'alert:light',
        figmaProperties: [
            // TEXT properties
            {
                name: 'Title',
                type: 'TEXT',
                defaultValue: 'Alert Title',
            },
            {
                name: 'Description',
                type: 'TEXT',
                defaultValue: 'This is an alert description that provides more details.',
            },
            // BOOLEAN properties
            {
                name: 'Show Icon',
                type: 'BOOLEAN',
                defaultValue: true,
            },
            {
                name: 'Show Close',
                type: 'BOOLEAN',
                defaultValue: true,
            },
            {
                name: 'Show Title',
                type: 'BOOLEAN',
                defaultValue: true,
            },
            // INSTANCE_SWAP property
            {
                name: 'Icon',
                type: 'INSTANCE_SWAP',
                defaultValue: 'InfoOutlined',
                options: AVAILABLE_ICONS,
            },
            // VARIANT properties
            {
                name: 'Severity',
                type: 'VARIANT',
                defaultValue: 'Info',
                options: ['Error', 'Warning', 'Info', 'Success'],
            },
            {
                name: 'Variant',
                type: 'VARIANT',
                defaultValue: 'Standard',
                options: ['Filled', 'Outlined', 'Standard'],
            },
        ],
    },
    'Alert/DarkMode': {
        component: FigmaAlert,
        defaultProps: {
            title: 'Alert Title',
            description: 'This is an alert description that provides more details.',
            severity: 'Info',
            variant: 'Standard',
            showIcon: true,
            showClose: true,
            showTitle: true,
            darkMode: true,
        },
        nodeId: 'alert:dark',
        figmaProperties: [
            // TEXT properties
            {
                name: 'Title',
                type: 'TEXT',
                defaultValue: 'Alert Title',
            },
            {
                name: 'Description',
                type: 'TEXT',
                defaultValue: 'This is an alert description that provides more details.',
            },
            // BOOLEAN properties
            {
                name: 'Show Icon',
                type: 'BOOLEAN',
                defaultValue: true,
            },
            {
                name: 'Show Close',
                type: 'BOOLEAN',
                defaultValue: true,
            },
            {
                name: 'Show Title',
                type: 'BOOLEAN',
                defaultValue: true,
            },
            // INSTANCE_SWAP property
            {
                name: 'Icon',
                type: 'INSTANCE_SWAP',
                defaultValue: 'InfoOutlined',
                options: AVAILABLE_ICONS,
            },
            // VARIANT properties
            {
                name: 'Severity',
                type: 'VARIANT',
                defaultValue: 'Info',
                options: ['Error', 'Warning', 'Info', 'Success'],
            },
            {
                name: 'Variant',
                type: 'VARIANT',
                defaultValue: 'Standard',
                options: ['Filled', 'Outlined', 'Standard'],
            },
        ],
    },
    // Avatar components
    'Avatar/LightMode': {
        component: FigmaAvatar,
        defaultProps: {
            initials: 'AB',
            alt: 'Avatar',
            size: 'Medium',
            variant: 'Circular',
            color: 'Primary',
            showImage: false,
            showIcon: false,
            darkMode: false,
        },
        nodeId: 'avatar:light',
        figmaProperties: [
            // TEXT properties
            {
                name: 'Initials',
                type: 'TEXT',
                defaultValue: 'AB',
            },
            {
                name: 'Alt',
                type: 'TEXT',
                defaultValue: 'Avatar',
            },
            // BOOLEAN properties
            {
                name: 'Show Image',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            {
                name: 'Show Icon',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            // VARIANT properties
            {
                name: 'Size',
                type: 'VARIANT',
                defaultValue: 'Medium',
                options: ['Small', 'Medium', 'Large'],
            },
            {
                name: 'Variant',
                type: 'VARIANT',
                defaultValue: 'Circular',
                options: ['Circular', 'Rounded', 'Square'],
            },
            {
                name: 'Color',
                type: 'VARIANT',
                defaultValue: 'Primary',
                options: ['Primary', 'Secondary', 'Error', 'Warning', 'Info', 'Success'],
            },
        ],
    },
    'Avatar/DarkMode': {
        component: FigmaAvatar,
        defaultProps: {
            initials: 'AB',
            alt: 'Avatar',
            size: 'Medium',
            variant: 'Circular',
            color: 'Primary',
            showImage: false,
            showIcon: false,
            darkMode: true,
        },
        nodeId: 'avatar:dark',
        figmaProperties: [
            // TEXT properties
            {
                name: 'Initials',
                type: 'TEXT',
                defaultValue: 'AB',
            },
            {
                name: 'Alt',
                type: 'TEXT',
                defaultValue: 'Avatar',
            },
            // BOOLEAN properties
            {
                name: 'Show Image',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            {
                name: 'Show Icon',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            // VARIANT properties
            {
                name: 'Size',
                type: 'VARIANT',
                defaultValue: 'Medium',
                options: ['Small', 'Medium', 'Large'],
            },
            {
                name: 'Variant',
                type: 'VARIANT',
                defaultValue: 'Circular',
                options: ['Circular', 'Rounded', 'Square'],
            },
            {
                name: 'Color',
                type: 'VARIANT',
                defaultValue: 'Primary',
                options: ['Primary', 'Secondary', 'Error', 'Warning', 'Info', 'Success'],
            },
        ],
    },
    // Badge components
    'Badge/LightMode': {
        component: FigmaBadge,
        defaultProps: {
            content: '4',
            color: 'Primary',
            variant: 'Standard',
            position: 'Top Right',
            size: 'Medium',
            showBadge: true,
            showZero: false,
            darkMode: false,
        },
        nodeId: 'badge:light',
        figmaProperties: [
            // TEXT properties
            {
                name: 'Content',
                type: 'TEXT',
                defaultValue: '4',
            },
            // BOOLEAN properties
            {
                name: 'Show Badge',
                type: 'BOOLEAN',
                defaultValue: true,
            },
            {
                name: 'Show Zero',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            // VARIANT properties
            {
                name: 'Color',
                type: 'VARIANT',
                defaultValue: 'Primary',
                options: ['Primary', 'Secondary', 'Error', 'Warning', 'Info', 'Success'],
            },
            {
                name: 'Variant',
                type: 'VARIANT',
                defaultValue: 'Standard',
                options: ['Standard', 'Dot'],
            },
            {
                name: 'Position',
                type: 'VARIANT',
                defaultValue: 'Top Right',
                options: ['Top Right', 'Top Left', 'Bottom Right', 'Bottom Left'],
            },
            {
                name: 'Size',
                type: 'VARIANT',
                defaultValue: 'Medium',
                options: ['Small', 'Medium', 'Large'],
            },
        ],
    },
    'Badge/DarkMode': {
        component: FigmaBadge,
        defaultProps: {
            content: '4',
            color: 'Primary',
            variant: 'Standard',
            position: 'Top Right',
            size: 'Medium',
            showBadge: true,
            showZero: false,
            darkMode: true,
        },
        nodeId: 'badge:dark',
        figmaProperties: [
            // TEXT properties
            {
                name: 'Content',
                type: 'TEXT',
                defaultValue: '4',
            },
            // BOOLEAN properties
            {
                name: 'Show Badge',
                type: 'BOOLEAN',
                defaultValue: true,
            },
            {
                name: 'Show Zero',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            // VARIANT properties
            {
                name: 'Color',
                type: 'VARIANT',
                defaultValue: 'Primary',
                options: ['Primary', 'Secondary', 'Error', 'Warning', 'Info', 'Success'],
            },
            {
                name: 'Variant',
                type: 'VARIANT',
                defaultValue: 'Standard',
                options: ['Standard', 'Dot'],
            },
            {
                name: 'Position',
                type: 'VARIANT',
                defaultValue: 'Top Right',
                options: ['Top Right', 'Top Left', 'Bottom Right', 'Bottom Left'],
            },
            {
                name: 'Size',
                type: 'VARIANT',
                defaultValue: 'Medium',
                options: ['Small', 'Medium', 'Large'],
            },
        ],
    },
    // Checkbox components
    'Checkbox/LightMode': {
        component: FigmaCheckbox,
        defaultProps: {
            label: 'Label',
            color: 'Primary',
            size: 'Medium',
            state: 'Enabled',
            checked: false,
            indeterminate: false,
            disabled: false,
            showLabel: true,
            darkMode: false,
        },
        nodeId: 'checkbox:light',
        figmaProperties: [
            // TEXT properties
            {
                name: 'Label',
                type: 'TEXT',
                defaultValue: 'Label',
            },
            // BOOLEAN properties
            {
                name: 'Checked',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            {
                name: 'Indeterminate',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            {
                name: 'Disabled',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            {
                name: 'Show Label',
                type: 'BOOLEAN',
                defaultValue: true,
            },
            // VARIANT properties
            {
                name: 'Color',
                type: 'VARIANT',
                defaultValue: 'Primary',
                options: ['Primary', 'Secondary', 'Error', 'Warning', 'Info', 'Success'],
            },
            {
                name: 'Size',
                type: 'VARIANT',
                defaultValue: 'Medium',
                options: ['Small', 'Medium', 'Large'],
            },
            {
                name: 'State',
                type: 'VARIANT',
                defaultValue: 'Enabled',
                options: ['Enabled', 'Hovered', 'Focused', 'Disabled'],
            },
        ],
    },
    'Checkbox/DarkMode': {
        component: FigmaCheckbox,
        defaultProps: {
            label: 'Label',
            color: 'Primary',
            size: 'Medium',
            state: 'Enabled',
            checked: false,
            indeterminate: false,
            disabled: false,
            showLabel: true,
            darkMode: true,
        },
        nodeId: 'checkbox:dark',
        figmaProperties: [
            // TEXT properties
            {
                name: 'Label',
                type: 'TEXT',
                defaultValue: 'Label',
            },
            // BOOLEAN properties
            {
                name: 'Checked',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            {
                name: 'Indeterminate',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            {
                name: 'Disabled',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            {
                name: 'Show Label',
                type: 'BOOLEAN',
                defaultValue: true,
            },
            // VARIANT properties
            {
                name: 'Color',
                type: 'VARIANT',
                defaultValue: 'Primary',
                options: ['Primary', 'Secondary', 'Error', 'Warning', 'Info', 'Success'],
            },
            {
                name: 'Size',
                type: 'VARIANT',
                defaultValue: 'Medium',
                options: ['Small', 'Medium', 'Large'],
            },
            {
                name: 'State',
                type: 'VARIANT',
                defaultValue: 'Enabled',
                options: ['Enabled', 'Hovered', 'Focused', 'Disabled'],
            },
        ],
    },
    // Chip components
    'Chip/LightMode': {
        component: FigmaChip,
        defaultProps: {
            label: 'Chip',
            color: 'Default',
            variant: 'Filled',
            size: 'Medium',
            state: 'Enabled',
            disabled: false,
            deletable: false,
            clickable: false,
            showIcon: false,
            showAvatar: false,
            darkMode: false,
        },
        nodeId: 'chip:light',
        figmaProperties: [
            // TEXT properties
            {
                name: 'Label',
                type: 'TEXT',
                defaultValue: 'Chip',
            },
            // BOOLEAN properties
            {
                name: 'Disabled',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            {
                name: 'Deletable',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            {
                name: 'Clickable',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            {
                name: 'Show Icon',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            {
                name: 'Show Avatar',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            // INSTANCE_SWAP property
            {
                name: 'Icon',
                type: 'INSTANCE_SWAP',
                defaultValue: 'Star',
                options: AVAILABLE_ICONS,
            },
            // VARIANT properties
            {
                name: 'Color',
                type: 'VARIANT',
                defaultValue: 'Default',
                options: ['Primary', 'Secondary', 'Error', 'Warning', 'Info', 'Success', 'Default'],
            },
            {
                name: 'Variant',
                type: 'VARIANT',
                defaultValue: 'Filled',
                options: ['Filled', 'Outlined'],
            },
            {
                name: 'Size',
                type: 'VARIANT',
                defaultValue: 'Medium',
                options: ['Small', 'Medium'],
            },
            {
                name: 'State',
                type: 'VARIANT',
                defaultValue: 'Enabled',
                options: ['Enabled', 'Hovered', 'Focused', 'Disabled'],
            },
        ],
    },
    'Chip/DarkMode': {
        component: FigmaChip,
        defaultProps: {
            label: 'Chip',
            color: 'Default',
            variant: 'Filled',
            size: 'Medium',
            state: 'Enabled',
            disabled: false,
            deletable: false,
            clickable: false,
            showIcon: false,
            showAvatar: false,
            darkMode: true,
        },
        nodeId: 'chip:dark',
        figmaProperties: [
            // TEXT properties
            {
                name: 'Label',
                type: 'TEXT',
                defaultValue: 'Chip',
            },
            // BOOLEAN properties
            {
                name: 'Disabled',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            {
                name: 'Deletable',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            {
                name: 'Clickable',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            {
                name: 'Show Icon',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            {
                name: 'Show Avatar',
                type: 'BOOLEAN',
                defaultValue: false,
            },
            // INSTANCE_SWAP property
            {
                name: 'Icon',
                type: 'INSTANCE_SWAP',
                defaultValue: 'Star',
                options: AVAILABLE_ICONS,
            },
            // VARIANT properties
            {
                name: 'Color',
                type: 'VARIANT',
                defaultValue: 'Default',
                options: ['Primary', 'Secondary', 'Error', 'Warning', 'Info', 'Success', 'Default'],
            },
            {
                name: 'Variant',
                type: 'VARIANT',
                defaultValue: 'Filled',
                options: ['Filled', 'Outlined'],
            },
            {
                name: 'Size',
                type: 'VARIANT',
                defaultValue: 'Medium',
                options: ['Small', 'Medium'],
            },
            {
                name: 'State',
                type: 'VARIANT',
                defaultValue: 'Enabled',
                options: ['Enabled', 'Hovered', 'Focused', 'Disabled'],
            },
        ],
    },
};

// Name aliases to handle Figma naming variations (e.g., "ButtonVariant/LightMode" -> "Button/LightMode")
const NAME_ALIASES: Record<string, string> = {
    'ButtonVariant/LightMode': 'Button/LightMode',
    'ButtonVariant/DarkMode': 'Button/DarkMode',
    'ButtonVariant/Light Mode': 'Button/LightMode',
    'ButtonVariant/Dark Mode': 'Button/DarkMode',
};

// Resolve name to canonical form (handles aliases)
function resolveComponentName(name: string): string {
    // Check direct alias
    if (NAME_ALIASES[name]) {
        return NAME_ALIASES[name];
    }
    // Check case-insensitive alias
    const lowerName = name.toLowerCase();
    for (const [alias, canonical] of Object.entries(NAME_ALIASES)) {
        if (alias.toLowerCase() === lowerName) {
            return canonical;
        }
    }
    // Check if it's already a registry key
    if (COMPONENT_REGISTRY[name]) {
        return name;
    }
    // Try partial matching for variant names
    const baseName = name.split('/')[0];
    for (const key of Object.keys(COMPONENT_REGISTRY)) {
        const keyBase = key.split('/')[0];
        // Match "Button" to "Button/LightMode" or "ButtonVariant" to "Button/LightMode"
        if (keyBase.toLowerCase() === baseName.toLowerCase() ||
            keyBase.toLowerCase() === baseName.replace(/variant/i, '').toLowerCase()) {
            // Prefer matching the mode suffix if present
            const modeSuffix = name.split('/')[1]?.toLowerCase();
            if (modeSuffix && key.toLowerCase().includes(modeSuffix.replace(/\s+/g, ''))) {
                return key;
            }
        }
    }
    return name;
}

// Get component by name
export function getComponentByName(name: string) {
    const resolvedName = resolveComponentName(name);
    return COMPONENT_REGISTRY[resolvedName] || null;
}

// Check if component is supported
export function isComponentSupported(name: string): boolean {
    const resolvedName = resolveComponentName(name);
    return resolvedName in COMPONENT_REGISTRY;
}

// Get all supported component names
export function getSupportedComponentNames(): string[] {
    return Object.keys(COMPONENT_REGISTRY);
}

// Get Figma properties for a component
export function getFigmaProperties(name: string): FigmaPropertyDefinition[] | null {
    console.log('🔎 getFigmaProperties called with:', name);
    const resolvedName = resolveComponentName(name);
    console.log('🔎 Resolved name:', resolvedName);
    console.log('🔎 Available registry keys:', Object.keys(COMPONENT_REGISTRY));
    const registration = COMPONENT_REGISTRY[resolvedName];
    console.log('🔎 Registration found:', !!registration, registration?.figmaProperties ? `has ${registration.figmaProperties.length} props` : 'no props');
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
export { FigmaAlert } from './FigmaAlert';
export { FigmaAvatar } from './FigmaAvatar';
export { FigmaBadge } from './FigmaBadge';
export { FigmaButton } from './FigmaButton';
export { FigmaBreadcrumb } from './FigmaBreadcrumb';
export { FigmaCheckbox } from './FigmaCheckbox';
export { FigmaChip } from './FigmaChip';
export { FigmaDropdown } from './FigmaDropdown';
export { FigmaProgressBar } from './FigmaProgressBar';
