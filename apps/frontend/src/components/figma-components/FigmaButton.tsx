'use client';
import React from 'react';
import { getIconByName, ArrowLeftIcon, ArrowRightIcon } from './FigmaIcons';

export interface FigmaButtonProps {
    label?: string;
    text?: string; // Alias for label (matches Figma "Text" property)
    darkMode?: boolean;
    // Boolean properties (matching Figma "Icon left" and "Icon right")
    iconLeft?: boolean;
    iconRight?: boolean;
    showLeftIcon?: boolean;  // Legacy alias for iconLeft
    showRightIcon?: boolean; // Legacy alias for iconRight
    // INSTANCE_SWAP properties - specify which icon to use
    // These map from Figma "Left Icon" and "Right Icon" properties
    leftIcon?: string;   // Icon type name (e.g., 'ArrowLeft', 'Search', 'Home')
    rightIcon?: string;  // Icon type name (e.g., 'ArrowRight', 'Settings', 'Add')
    // Variant properties (matching Figma)
    size?: 'Small' | 'Medium' | 'Large';
    color?: 'Primary' | 'Secondary' | 'Error' | 'Warning' | 'Info' | 'Success' | 'Disabled';
    state?: 'Enabled' | 'Hovered' | 'Focused' | 'Disabled';
    type?: 'Contained' | 'Outlined' | 'Text';
    disabled?: boolean;
}

/**
 * FigmaButton - Generated from Figma design
 * Supports LightMode and DarkMode variants with full property support
 *
 * Properties:
 * - iconLeft/iconRight: Show/hide icons
 * - size: Small, Medium, Large
 * - color: Primary, Secondary, Error, Warning, Info, Success
 * - state: Enabled, Hovered, Focused, Disabled
 * - type: Contained, Outlined, Text
 */
export function FigmaButton({
    label,
    text,
    darkMode = false,
    iconLeft,
    iconRight,
    showLeftIcon,
    showRightIcon,
    leftIcon = 'ArrowLeft',
    rightIcon = 'ArrowRight',
    size = 'Large',
    color = 'Primary',
    state = 'Enabled',
    type = 'Contained',
    disabled = false,
}: FigmaButtonProps) {
    // Use text if provided, otherwise fall back to label
    const buttonLabel = text ?? label ?? 'Button';

    // Use iconLeft/iconRight if provided, otherwise fall back to showLeftIcon/showRightIcon
    const showLeft = iconLeft ?? showLeftIcon ?? true;
    const showRight = iconRight ?? showRightIcon ?? true;

    // Get icon components from registry
    const LeftIconComponent = getIconByName(leftIcon) || ArrowLeftIcon;
    const RightIconComponent = getIconByName(rightIcon) || ArrowRightIcon;

    // Determine if disabled from state or disabled prop
    const isDisabled = disabled || state === 'Disabled';

    // Size configurations
    const sizeConfig = {
        Small: { height: 'h-[30px]', padding: 'px-[10px] py-[4px]', fontSize: 'text-[13px]', iconSize: 'w-[18px] h-[18px]' },
        Medium: { height: 'h-[36px]', padding: 'px-[16px] py-[6px]', fontSize: 'text-[14px]', iconSize: 'w-[20px] h-[20px]' },
        Large: { height: 'h-[42px]', padding: 'px-[22px] py-[8px]', fontSize: 'text-[15px]', iconSize: 'w-[24px] h-[24px]' },
    };

    // Color palette
    const colorPalette: Record<string, { main: string; dark: string; contrast: string }> = {
        Primary: { main: '#1976d2', dark: '#1565c0', contrast: 'white' },
        Secondary: { main: '#9c27b0', dark: '#7b1fa2', contrast: 'white' },
        Error: { main: '#d32f2f', dark: '#c62828', contrast: 'white' },
        Warning: { main: '#ed6c02', dark: '#e65100', contrast: 'white' },
        Info: { main: '#0288d1', dark: '#01579b', contrast: 'white' },
        Success: { main: '#2e7d32', dark: '#1b5e20', contrast: 'white' },
        Disabled: { main: '#0000001f', dark: '#0000001f', contrast: '#00000042' },
    };

    const currentSize = sizeConfig[size] || sizeConfig.Large;
    const currentColor = colorPalette[color] || colorPalette.Primary;

    // Calculate colors based on type, state, and mode
    let bgColor: string;
    let textColor: string;
    let borderColor: string | undefined;

    if (darkMode) {
        // Dark mode uses lighter versions
        const lightColor = currentColor.main.replace('#', '');
        bgColor = type === 'Contained' ? `#${lightColor}` : 'transparent';
        textColor = type === 'Contained' ? 'rgba(0, 0, 0, 0.87)' : currentColor.main;
        borderColor = type === 'Outlined' ? currentColor.main : undefined;
    } else {
        bgColor = type === 'Contained' ? currentColor.main : 'transparent';
        textColor = type === 'Contained' ? currentColor.contrast : currentColor.main;
        borderColor = type === 'Outlined' ? currentColor.main : undefined;
    }

    // State modifications
    if (state === 'Hovered' && type === 'Contained') {
        bgColor = currentColor.dark;
    } else if (state === 'Hovered' && type !== 'Contained') {
        bgColor = `${currentColor.main}14`; // 8% opacity
    } else if (state === 'Focused') {
        bgColor = type === 'Contained' ? currentColor.dark : `${currentColor.main}1F`; // 12% opacity
    }

    return (
        <div
            data-node-id={darkMode ? "14:3738" : "14:3737"}
            data-figma-props={JSON.stringify({ iconLeft: showLeft, iconRight: showRight, size, color, state, type })}
            className="flex items-start"
        >
            <button
                disabled={isDisabled}
                className={`
                    flex items-center justify-center
                    ${currentSize.height} ${currentSize.padding}
                    rounded-[4px] overflow-hidden
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    transition-all duration-200
                    ${type === 'Outlined' ? 'border' : ''}
                `}
                style={{
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                }}
            >
                <div className="flex items-center gap-[8px]">
                    {/* Left Icon */}
                    {showLeft && (
                        <div className={`${currentSize.iconSize} flex items-center justify-center`}>
                            <LeftIconComponent color={textColor} />
                        </div>
                    )}

                    {/* Button Label */}
                    <span
                        className={`${currentSize.fontSize} font-medium leading-[1.5] tracking-[0.15px]`}
                        style={{
                            fontFamily: "'Roboto', sans-serif",
                            color: textColor,
                        }}
                    >
                        {buttonLabel}
                    </span>

                    {/* Right Icon */}
                    {showRight && (
                        <div className={`${currentSize.iconSize} flex items-center justify-center`}>
                            <RightIconComponent color={textColor} />
                        </div>
                    )}
                </div>
            </button>
        </div>
    );
}

export default FigmaButton;
