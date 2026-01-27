'use client';
import React from 'react';
import { getIconByName, SettingsIcon } from './FigmaIcons';

export interface FigmaIconButtonProps {
    icon?: string;
    ariaLabel?: string;
    darkMode?: boolean;
    // Variant properties
    variant?: 'Standard' | 'Contained' | 'Outlined';
    size?: 'Small' | 'Medium' | 'Large';
    color?: 'Default' | 'Primary' | 'Secondary' | 'Error' | 'Warning' | 'Info' | 'Success';
    state?: 'Enabled' | 'Hovered' | 'Focused' | 'Disabled';
    // Boolean properties
    disabled?: boolean;
}

/**
 * FigmaIconButton - Icon-only button component
 * Supports LightMode and DarkMode variants
 *
 * Properties:
 * - variant: Standard, Contained, Outlined
 * - size: Small, Medium, Large
 * - color: Default, Primary, Secondary, Error, Warning, Info, Success
 * - state: Enabled, Hovered, Focused, Disabled
 */
export function FigmaIconButton({
    icon = 'Settings',
    ariaLabel = 'Icon button',
    darkMode = false,
    variant = 'Standard',
    size = 'Medium',
    color = 'Default',
    state = 'Enabled',
    disabled = false,
}: FigmaIconButtonProps) {
    const isDisabled = disabled || state === 'Disabled';
    const isHovered = state === 'Hovered';
    const isFocused = state === 'Focused';

    // Get icon component
    const IconComponent = getIconByName(icon) || SettingsIcon;

    // Size configurations
    const sizeConfig = {
        Small: { button: 'w-[32px] h-[32px]', icon: 'w-[18px] h-[18px]' },
        Medium: { button: 'w-[40px] h-[40px]', icon: 'w-[24px] h-[24px]' },
        Large: { button: 'w-[48px] h-[48px]', icon: 'w-[28px] h-[28px]' },
    };

    // Color palette
    const colorPalette: Record<string, { main: string; light: string; contrast: string }> = {
        Default: { main: darkMode ? 'rgba(255,255,255,0.54)' : 'rgba(0,0,0,0.54)', light: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', contrast: darkMode ? 'white' : 'black' },
        Primary: { main: '#1976d2', light: 'rgba(25,118,210,0.12)', contrast: 'white' },
        Secondary: { main: '#9c27b0', light: 'rgba(156,39,176,0.12)', contrast: 'white' },
        Error: { main: '#d32f2f', light: 'rgba(211,47,47,0.12)', contrast: 'white' },
        Warning: { main: '#ed6c02', light: 'rgba(237,108,2,0.12)', contrast: 'white' },
        Info: { main: '#0288d1', light: 'rgba(2,136,209,0.12)', contrast: 'white' },
        Success: { main: '#2e7d32', light: 'rgba(46,125,50,0.12)', contrast: 'white' },
    };

    const currentSize = sizeConfig[size] || sizeConfig.Medium;
    const currentColor = colorPalette[color] || colorPalette.Default;

    // Calculate colors based on variant and state
    let bgColor: string;
    let iconColor: string;
    let borderColor: string | undefined;

    if (variant === 'Contained') {
        bgColor = isDisabled ? (darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)') : currentColor.main;
        iconColor = isDisabled ? (darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)') : currentColor.contrast;
    } else if (variant === 'Outlined') {
        bgColor = isHovered || isFocused ? currentColor.light : 'transparent';
        iconColor = isDisabled ? (darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)') : currentColor.main;
        borderColor = isDisabled ? (darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)') : currentColor.main;
    } else {
        // Standard
        bgColor = isHovered || isFocused ? currentColor.light : 'transparent';
        iconColor = isDisabled ? (darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)') : currentColor.main;
    }

    return (
        <button
            aria-label={ariaLabel}
            disabled={isDisabled}
            data-node-id={darkMode ? "iconbutton:dark" : "iconbutton:light"}
            data-figma-props={JSON.stringify({ variant, size, color, state })}
            className={`
                ${currentSize.button}
                flex items-center justify-center
                rounded-full
                ${variant === 'Outlined' ? 'border' : ''}
                ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                transition-all duration-200
            `}
            style={{
                backgroundColor: bgColor,
                borderColor: borderColor,
            }}
        >
            <div className={`${currentSize.icon} flex items-center justify-center`}>
                <IconComponent color={iconColor} />
            </div>
        </button>
    );
}

export default FigmaIconButton;
