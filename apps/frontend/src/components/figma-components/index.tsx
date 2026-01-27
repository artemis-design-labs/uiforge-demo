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
import { FigmaTextField } from './FigmaTextField';
import { FigmaTextArea } from './FigmaTextArea';
import { FigmaTabs } from './FigmaTabs';
import { FigmaNavItem } from './FigmaNavItem';
import { FigmaIconButton } from './FigmaIconButton';
import { FigmaSearchInput } from './FigmaSearchInput';
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
    // TextField components
    'TextField/LightMode': {
        component: FigmaTextField,
        defaultProps: {
            label: 'Label',
            placeholder: 'Placeholder',
            value: '',
            helperText: 'Helper text',
            variant: 'Outlined',
            size: 'Medium',
            state: 'Enabled',
            showLabel: true,
            showHelperText: false,
            required: false,
            fullWidth: false,
            darkMode: false,
        },
        nodeId: 'textfield:light',
        figmaProperties: [
            { name: 'Label', type: 'TEXT', defaultValue: 'Label' },
            { name: 'Placeholder', type: 'TEXT', defaultValue: 'Placeholder' },
            { name: 'Helper Text', type: 'TEXT', defaultValue: 'Helper text' },
            { name: 'Show Label', type: 'BOOLEAN', defaultValue: true },
            { name: 'Show Helper Text', type: 'BOOLEAN', defaultValue: false },
            { name: 'Required', type: 'BOOLEAN', defaultValue: false },
            { name: 'Full Width', type: 'BOOLEAN', defaultValue: false },
            { name: 'Variant', type: 'VARIANT', defaultValue: 'Outlined', options: ['Outlined', 'Filled', 'Standard'] },
            { name: 'Size', type: 'VARIANT', defaultValue: 'Medium', options: ['Small', 'Medium'] },
            { name: 'State', type: 'VARIANT', defaultValue: 'Enabled', options: ['Enabled', 'Hovered', 'Focused', 'Disabled', 'Error'] },
        ],
    },
    'TextField/DarkMode': {
        component: FigmaTextField,
        defaultProps: {
            label: 'Label',
            placeholder: 'Placeholder',
            value: '',
            helperText: 'Helper text',
            variant: 'Outlined',
            size: 'Medium',
            state: 'Enabled',
            showLabel: true,
            showHelperText: false,
            required: false,
            fullWidth: false,
            darkMode: true,
        },
        nodeId: 'textfield:dark',
        figmaProperties: [
            { name: 'Label', type: 'TEXT', defaultValue: 'Label' },
            { name: 'Placeholder', type: 'TEXT', defaultValue: 'Placeholder' },
            { name: 'Helper Text', type: 'TEXT', defaultValue: 'Helper text' },
            { name: 'Show Label', type: 'BOOLEAN', defaultValue: true },
            { name: 'Show Helper Text', type: 'BOOLEAN', defaultValue: false },
            { name: 'Required', type: 'BOOLEAN', defaultValue: false },
            { name: 'Full Width', type: 'BOOLEAN', defaultValue: false },
            { name: 'Variant', type: 'VARIANT', defaultValue: 'Outlined', options: ['Outlined', 'Filled', 'Standard'] },
            { name: 'Size', type: 'VARIANT', defaultValue: 'Medium', options: ['Small', 'Medium'] },
            { name: 'State', type: 'VARIANT', defaultValue: 'Enabled', options: ['Enabled', 'Hovered', 'Focused', 'Disabled', 'Error'] },
        ],
    },
    // TextArea components
    'TextArea/LightMode': {
        component: FigmaTextArea,
        defaultProps: {
            label: 'Label',
            placeholder: 'Body text (optional)',
            value: '',
            helperText: 'Helper text',
            variant: 'Outlined',
            state: 'Enabled',
            showLabel: true,
            showHelperText: false,
            showCharCount: true,
            required: false,
            fullWidth: false,
            rows: 4,
            maxLength: 300,
            darkMode: false,
        },
        nodeId: 'textarea:light',
        figmaProperties: [
            { name: 'Label', type: 'TEXT', defaultValue: 'Label' },
            { name: 'Placeholder', type: 'TEXT', defaultValue: 'Body text (optional)' },
            { name: 'Helper Text', type: 'TEXT', defaultValue: 'Helper text' },
            { name: 'Show Label', type: 'BOOLEAN', defaultValue: true },
            { name: 'Show Helper Text', type: 'BOOLEAN', defaultValue: false },
            { name: 'Show Char Count', type: 'BOOLEAN', defaultValue: true },
            { name: 'Required', type: 'BOOLEAN', defaultValue: false },
            { name: 'Full Width', type: 'BOOLEAN', defaultValue: false },
            { name: 'Variant', type: 'VARIANT', defaultValue: 'Outlined', options: ['Outlined', 'Filled'] },
            { name: 'State', type: 'VARIANT', defaultValue: 'Enabled', options: ['Enabled', 'Hovered', 'Focused', 'Disabled', 'Error'] },
        ],
    },
    'TextArea/DarkMode': {
        component: FigmaTextArea,
        defaultProps: {
            label: 'Label',
            placeholder: 'Body text (optional)',
            value: '',
            helperText: 'Helper text',
            variant: 'Outlined',
            state: 'Enabled',
            showLabel: true,
            showHelperText: false,
            showCharCount: true,
            required: false,
            fullWidth: false,
            rows: 4,
            maxLength: 300,
            darkMode: true,
        },
        nodeId: 'textarea:dark',
        figmaProperties: [
            { name: 'Label', type: 'TEXT', defaultValue: 'Label' },
            { name: 'Placeholder', type: 'TEXT', defaultValue: 'Body text (optional)' },
            { name: 'Helper Text', type: 'TEXT', defaultValue: 'Helper text' },
            { name: 'Show Label', type: 'BOOLEAN', defaultValue: true },
            { name: 'Show Helper Text', type: 'BOOLEAN', defaultValue: false },
            { name: 'Show Char Count', type: 'BOOLEAN', defaultValue: true },
            { name: 'Required', type: 'BOOLEAN', defaultValue: false },
            { name: 'Full Width', type: 'BOOLEAN', defaultValue: false },
            { name: 'Variant', type: 'VARIANT', defaultValue: 'Outlined', options: ['Outlined', 'Filled'] },
            { name: 'State', type: 'VARIANT', defaultValue: 'Enabled', options: ['Enabled', 'Hovered', 'Focused', 'Disabled', 'Error'] },
        ],
    },
    // Tabs components
    'Tabs/LightMode': {
        component: FigmaTabs,
        defaultProps: {
            tabs: [
                { label: 'Tab One', value: 'one' },
                { label: 'Tab Two', value: 'two' },
                { label: 'Tab Three', value: 'three' },
            ],
            activeTab: 'one',
            variant: 'Standard',
            color: 'Primary',
            orientation: 'Horizontal',
            indicatorPosition: 'Bottom',
            showIcon: false,
            centered: false,
            darkMode: false,
        },
        nodeId: 'tabs:light',
        figmaProperties: [
            { name: 'Show Icon', type: 'BOOLEAN', defaultValue: false },
            { name: 'Centered', type: 'BOOLEAN', defaultValue: false },
            { name: 'Variant', type: 'VARIANT', defaultValue: 'Standard', options: ['Standard', 'Fullwidth'] },
            { name: 'Color', type: 'VARIANT', defaultValue: 'Primary', options: ['Primary', 'Secondary'] },
            { name: 'Orientation', type: 'VARIANT', defaultValue: 'Horizontal', options: ['Horizontal', 'Vertical'] },
            { name: 'Indicator Position', type: 'VARIANT', defaultValue: 'Bottom', options: ['Bottom', 'Top'] },
        ],
    },
    'Tabs/DarkMode': {
        component: FigmaTabs,
        defaultProps: {
            tabs: [
                { label: 'Tab One', value: 'one' },
                { label: 'Tab Two', value: 'two' },
                { label: 'Tab Three', value: 'three' },
            ],
            activeTab: 'one',
            variant: 'Standard',
            color: 'Primary',
            orientation: 'Horizontal',
            indicatorPosition: 'Bottom',
            showIcon: false,
            centered: false,
            darkMode: true,
        },
        nodeId: 'tabs:dark',
        figmaProperties: [
            { name: 'Show Icon', type: 'BOOLEAN', defaultValue: false },
            { name: 'Centered', type: 'BOOLEAN', defaultValue: false },
            { name: 'Variant', type: 'VARIANT', defaultValue: 'Standard', options: ['Standard', 'Fullwidth'] },
            { name: 'Color', type: 'VARIANT', defaultValue: 'Primary', options: ['Primary', 'Secondary'] },
            { name: 'Orientation', type: 'VARIANT', defaultValue: 'Horizontal', options: ['Horizontal', 'Vertical'] },
            { name: 'Indicator Position', type: 'VARIANT', defaultValue: 'Bottom', options: ['Bottom', 'Top'] },
        ],
    },
    // NavItem components
    'NavItem/LightMode': {
        component: FigmaNavItem,
        defaultProps: {
            label: 'Home',
            icon: 'Home',
            href: '#',
            variant: 'Default',
            state: 'Default',
            showIcon: true,
            showBadge: false,
            badgeContent: '',
            selected: false,
            darkMode: false,
        },
        nodeId: 'navitem:light',
        figmaProperties: [
            { name: 'Label', type: 'TEXT', defaultValue: 'Home' },
            { name: 'Show Icon', type: 'BOOLEAN', defaultValue: true },
            { name: 'Show Badge', type: 'BOOLEAN', defaultValue: false },
            { name: 'Selected', type: 'BOOLEAN', defaultValue: false },
            { name: 'Icon', type: 'INSTANCE_SWAP', defaultValue: 'Home', options: AVAILABLE_ICONS },
            { name: 'Variant', type: 'VARIANT', defaultValue: 'Default', options: ['Default', 'Compact'] },
            { name: 'State', type: 'VARIANT', defaultValue: 'Default', options: ['Default', 'Hovered', 'Active', 'Disabled'] },
        ],
    },
    'NavItem/DarkMode': {
        component: FigmaNavItem,
        defaultProps: {
            label: 'Home',
            icon: 'Home',
            href: '#',
            variant: 'Default',
            state: 'Default',
            showIcon: true,
            showBadge: false,
            badgeContent: '',
            selected: false,
            darkMode: true,
        },
        nodeId: 'navitem:dark',
        figmaProperties: [
            { name: 'Label', type: 'TEXT', defaultValue: 'Home' },
            { name: 'Show Icon', type: 'BOOLEAN', defaultValue: true },
            { name: 'Show Badge', type: 'BOOLEAN', defaultValue: false },
            { name: 'Selected', type: 'BOOLEAN', defaultValue: false },
            { name: 'Icon', type: 'INSTANCE_SWAP', defaultValue: 'Home', options: AVAILABLE_ICONS },
            { name: 'Variant', type: 'VARIANT', defaultValue: 'Default', options: ['Default', 'Compact'] },
            { name: 'State', type: 'VARIANT', defaultValue: 'Default', options: ['Default', 'Hovered', 'Active', 'Disabled'] },
        ],
    },
    // IconButton components
    'IconButton/LightMode': {
        component: FigmaIconButton,
        defaultProps: {
            icon: 'Settings',
            ariaLabel: 'Icon button',
            variant: 'Standard',
            size: 'Medium',
            color: 'Default',
            state: 'Enabled',
            darkMode: false,
        },
        nodeId: 'iconbutton:light',
        figmaProperties: [
            { name: 'Aria Label', type: 'TEXT', defaultValue: 'Icon button' },
            { name: 'Icon', type: 'INSTANCE_SWAP', defaultValue: 'Settings', options: AVAILABLE_ICONS },
            { name: 'Variant', type: 'VARIANT', defaultValue: 'Standard', options: ['Standard', 'Contained', 'Outlined'] },
            { name: 'Size', type: 'VARIANT', defaultValue: 'Medium', options: ['Small', 'Medium', 'Large'] },
            { name: 'Color', type: 'VARIANT', defaultValue: 'Default', options: ['Default', 'Primary', 'Secondary', 'Error', 'Warning', 'Info', 'Success'] },
            { name: 'State', type: 'VARIANT', defaultValue: 'Enabled', options: ['Enabled', 'Hovered', 'Focused', 'Disabled'] },
        ],
    },
    'IconButton/DarkMode': {
        component: FigmaIconButton,
        defaultProps: {
            icon: 'Settings',
            ariaLabel: 'Icon button',
            variant: 'Standard',
            size: 'Medium',
            color: 'Default',
            state: 'Enabled',
            darkMode: true,
        },
        nodeId: 'iconbutton:dark',
        figmaProperties: [
            { name: 'Aria Label', type: 'TEXT', defaultValue: 'Icon button' },
            { name: 'Icon', type: 'INSTANCE_SWAP', defaultValue: 'Settings', options: AVAILABLE_ICONS },
            { name: 'Variant', type: 'VARIANT', defaultValue: 'Standard', options: ['Standard', 'Contained', 'Outlined'] },
            { name: 'Size', type: 'VARIANT', defaultValue: 'Medium', options: ['Small', 'Medium', 'Large'] },
            { name: 'Color', type: 'VARIANT', defaultValue: 'Default', options: ['Default', 'Primary', 'Secondary', 'Error', 'Warning', 'Info', 'Success'] },
            { name: 'State', type: 'VARIANT', defaultValue: 'Enabled', options: ['Enabled', 'Hovered', 'Focused', 'Disabled'] },
        ],
    },
    // SearchInput components
    'SearchInput/LightMode': {
        component: FigmaSearchInput,
        defaultProps: {
            placeholder: 'Search',
            value: '',
            variant: 'Filled',
            size: 'Medium',
            state: 'Enabled',
            showClearButton: true,
            fullWidth: false,
            darkMode: false,
        },
        nodeId: 'searchinput:light',
        figmaProperties: [
            { name: 'Placeholder', type: 'TEXT', defaultValue: 'Search' },
            { name: 'Show Clear Button', type: 'BOOLEAN', defaultValue: true },
            { name: 'Full Width', type: 'BOOLEAN', defaultValue: false },
            { name: 'Variant', type: 'VARIANT', defaultValue: 'Filled', options: ['Outlined', 'Filled'] },
            { name: 'Size', type: 'VARIANT', defaultValue: 'Medium', options: ['Small', 'Medium'] },
            { name: 'State', type: 'VARIANT', defaultValue: 'Enabled', options: ['Enabled', 'Hovered', 'Focused', 'Disabled'] },
        ],
    },
    'SearchInput/DarkMode': {
        component: FigmaSearchInput,
        defaultProps: {
            placeholder: 'Search',
            value: '',
            variant: 'Filled',
            size: 'Medium',
            state: 'Enabled',
            showClearButton: true,
            fullWidth: false,
            darkMode: true,
        },
        nodeId: 'searchinput:dark',
        figmaProperties: [
            { name: 'Placeholder', type: 'TEXT', defaultValue: 'Search' },
            { name: 'Show Clear Button', type: 'BOOLEAN', defaultValue: true },
            { name: 'Full Width', type: 'BOOLEAN', defaultValue: false },
            { name: 'Variant', type: 'VARIANT', defaultValue: 'Filled', options: ['Outlined', 'Filled'] },
            { name: 'Size', type: 'VARIANT', defaultValue: 'Medium', options: ['Small', 'Medium'] },
            { name: 'State', type: 'VARIANT', defaultValue: 'Enabled', options: ['Enabled', 'Hovered', 'Focused', 'Disabled'] },
        ],
    },
};

// Name aliases to handle Figma naming variations (e.g., "ButtonVariant/LightMode" -> "Button/LightMode")
const NAME_ALIASES: Record<string, string> = {
    // Button aliases
    'ButtonVariant/LightMode': 'Button/LightMode',
    'ButtonVariant/DarkMode': 'Button/DarkMode',
    'ButtonVariant/Light Mode': 'Button/LightMode',
    'ButtonVariant/Dark Mode': 'Button/DarkMode',
    'Button/Light Mode': 'Button/LightMode',
    'Button/Dark Mode': 'Button/DarkMode',
    // Accordion aliases
    'Accordion/Light Mode': 'Accordion/LightMode',
    'Accordion/Dark Mode': 'Accordion/DarkMode',
    'AccordionVariant/LightMode': 'Accordion/LightMode',
    'AccordionVariant/DarkMode': 'Accordion/DarkMode',
    'AccordionVariant/Light Mode': 'Accordion/LightMode',
    'AccordionVariant/Dark Mode': 'Accordion/DarkMode',
    // Alert aliases
    'Alert/Light Mode': 'Alert/LightMode',
    'Alert/Dark Mode': 'Alert/DarkMode',
    'AlertVariant/LightMode': 'Alert/LightMode',
    'AlertVariant/DarkMode': 'Alert/DarkMode',
    'AlertVariant/Light Mode': 'Alert/LightMode',
    'AlertVariant/Dark Mode': 'Alert/DarkMode',
    // Avatar aliases
    'Avatar/Light Mode': 'Avatar/LightMode',
    'Avatar/Dark Mode': 'Avatar/DarkMode',
    'AvatarVariant/LightMode': 'Avatar/LightMode',
    'AvatarVariant/DarkMode': 'Avatar/DarkMode',
    'AvatarVariant/Light Mode': 'Avatar/LightMode',
    'AvatarVariant/Dark Mode': 'Avatar/DarkMode',
    // Badge aliases
    'Badge/Light Mode': 'Badge/LightMode',
    'Badge/Dark Mode': 'Badge/DarkMode',
    'BadgeVariant/LightMode': 'Badge/LightMode',
    'BadgeVariant/DarkMode': 'Badge/DarkMode',
    'BadgeVariant/Light Mode': 'Badge/LightMode',
    'BadgeVariant/Dark Mode': 'Badge/DarkMode',
    'Badge Variant/Light Mode': 'Badge/LightMode',
    'Badge Variant/Dark Mode': 'Badge/DarkMode',
    'Badge Standard/Light Mode': 'Badge/LightMode',
    'Badge Standard/Dark Mode': 'Badge/DarkMode',
    // Checkbox aliases
    'Checkbox/Light Mode': 'Checkbox/LightMode',
    'Checkbox/Dark Mode': 'Checkbox/DarkMode',
    'CheckboxVariant/LightMode': 'Checkbox/LightMode',
    'CheckboxVariant/DarkMode': 'Checkbox/DarkMode',
    'CheckboxVariant/Light Mode': 'Checkbox/LightMode',
    'CheckboxVariant/Dark Mode': 'Checkbox/DarkMode',
    // Chip aliases
    'Chip/Light Mode': 'Chip/LightMode',
    'Chip/Dark Mode': 'Chip/DarkMode',
    'ChipVariant/LightMode': 'Chip/LightMode',
    'ChipVariant/DarkMode': 'Chip/DarkMode',
    'ChipVariant/Light Mode': 'Chip/LightMode',
    'ChipVariant/Dark Mode': 'Chip/DarkMode',
    // Dropdown aliases
    'Dropdown/Light Mode': 'Dropdown/LightMode',
    'Dropdown/Dark Mode': 'Dropdown/LightMode',
    'DropdownVariant/LightMode': 'Dropdown/LightMode',
    'DropdownVariant/Light Mode': 'Dropdown/LightMode',
    // Progress aliases
    'ProgressLinear/Light Mode': 'ProgressLinear/LightMode',
    'ProgressLinear/Dark Mode': 'ProgressLinear/LightMode',
    'Progress/LightMode': 'ProgressLinear/LightMode',
    'Progress/Light Mode': 'ProgressLinear/LightMode',
    // Breadcrumb aliases
    'Breadcrumb/LightMode': 'Breadcrumb/Light Mode',
    'Breadcrumb/DarkMode': 'Breadcrumb/Dark Mode',
    // TextField aliases
    'TextField/Light Mode': 'TextField/LightMode',
    'TextField/Dark Mode': 'TextField/DarkMode',
    'TextFieldVariant/LightMode': 'TextField/LightMode',
    'TextFieldVariant/DarkMode': 'TextField/DarkMode',
    'Input/LightMode': 'TextField/LightMode',
    'Input/DarkMode': 'TextField/DarkMode',
    'Input/Light Mode': 'TextField/LightMode',
    'Input/Dark Mode': 'TextField/DarkMode',
    // TextArea aliases
    'TextArea/Light Mode': 'TextArea/LightMode',
    'TextArea/Dark Mode': 'TextArea/DarkMode',
    'TextAreaVariant/LightMode': 'TextArea/LightMode',
    'TextAreaVariant/DarkMode': 'TextArea/DarkMode',
    'Textarea/LightMode': 'TextArea/LightMode',
    'Textarea/DarkMode': 'TextArea/DarkMode',
    // Tabs aliases
    'Tabs/Light Mode': 'Tabs/LightMode',
    'Tabs/Dark Mode': 'Tabs/DarkMode',
    'TabsVariant/LightMode': 'Tabs/LightMode',
    'TabsVariant/DarkMode': 'Tabs/DarkMode',
    'TabBar/LightMode': 'Tabs/LightMode',
    'TabBar/DarkMode': 'Tabs/DarkMode',
    // NavItem aliases
    'NavItem/Light Mode': 'NavItem/LightMode',
    'NavItem/Dark Mode': 'NavItem/DarkMode',
    'NavItemVariant/LightMode': 'NavItem/LightMode',
    'NavItemVariant/DarkMode': 'NavItem/DarkMode',
    'ListItem/LightMode': 'NavItem/LightMode',
    'ListItem/DarkMode': 'NavItem/DarkMode',
    'ListItem/Light Mode': 'NavItem/LightMode',
    'ListItem/Dark Mode': 'NavItem/DarkMode',
    'NavigationItem/LightMode': 'NavItem/LightMode',
    'NavigationItem/DarkMode': 'NavItem/DarkMode',
    // IconButton aliases
    'IconButton/Light Mode': 'IconButton/LightMode',
    'IconButton/Dark Mode': 'IconButton/DarkMode',
    'IconButtonVariant/LightMode': 'IconButton/LightMode',
    'IconButtonVariant/DarkMode': 'IconButton/DarkMode',
    'Icon Button/LightMode': 'IconButton/LightMode',
    'Icon Button/DarkMode': 'IconButton/DarkMode',
    // SearchInput aliases
    'SearchInput/Light Mode': 'SearchInput/LightMode',
    'SearchInput/Dark Mode': 'SearchInput/DarkMode',
    'SearchInputVariant/LightMode': 'SearchInput/LightMode',
    'SearchInputVariant/DarkMode': 'SearchInput/DarkMode',
    'Search/LightMode': 'SearchInput/LightMode',
    'Search/DarkMode': 'SearchInput/DarkMode',
    'SearchBar/LightMode': 'SearchInput/LightMode',
    'SearchBar/DarkMode': 'SearchInput/DarkMode',
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
export { FigmaTextField } from './FigmaTextField';
export { FigmaTextArea } from './FigmaTextArea';
export { FigmaTabs } from './FigmaTabs';
export { FigmaNavItem } from './FigmaNavItem';
export { FigmaIconButton } from './FigmaIconButton';
export { FigmaSearchInput } from './FigmaSearchInput';
