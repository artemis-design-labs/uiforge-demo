'use client';
import React from 'react';

// Checkbox icons
const CheckboxUncheckedIcon = ({ color = 'currentColor', size = 24 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 5V19H5V5H19ZM19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" fill={color} />
    </svg>
);

const CheckboxCheckedIcon = ({ color = 'currentColor', size = 24 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.11 21 21 20.1 21 19V5C21 3.9 20.11 3 19 3ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill={color} />
    </svg>
);

const CheckboxIndeterminateIcon = ({ color = 'currentColor', size = 24 }: { color?: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM17 13H7V11H17V13Z" fill={color} />
    </svg>
);

export interface FigmaCheckboxProps {
    // TEXT properties
    label?: string;
    // VARIANT properties
    color?: 'Primary' | 'Secondary' | 'Error' | 'Warning' | 'Info' | 'Success';
    size?: 'Small' | 'Medium' | 'Large';
    state?: 'Enabled' | 'Hovered' | 'Focused' | 'Disabled';
    // BOOLEAN properties
    checked?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    showLabel?: boolean;
    // Mode
    darkMode?: boolean;
}

/**
 * FigmaCheckbox - Checkbox component from Figma design
 * Supports checked, unchecked, and indeterminate states
 */
export function FigmaCheckbox({
    label = 'Label',
    color = 'Primary',
    size = 'Medium',
    state = 'Enabled',
    checked = false,
    indeterminate = false,
    disabled = false,
    showLabel = true,
    darkMode = false,
}: FigmaCheckboxProps) {
    // Size configurations
    const sizeConfig = {
        Small: { iconSize: 20, fontSize: 13, padding: 8 },
        Medium: { iconSize: 24, fontSize: 14, padding: 9 },
        Large: { iconSize: 28, fontSize: 16, padding: 10 },
    };

    // Color configurations
    const colorConfig: Record<string, string> = {
        Primary: '#1976d2',
        Secondary: '#9c27b0',
        Error: '#d32f2f',
        Warning: '#ed6c02',
        Info: '#0288d1',
        Success: '#2e7d32',
    };

    const currentSize = sizeConfig[size] || sizeConfig.Medium;
    const activeColor = colorConfig[color] || colorConfig.Primary;

    // Determine if disabled from state or disabled prop
    const isDisabled = disabled || state === 'Disabled';

    // Text colors
    const textColor = darkMode
        ? isDisabled ? 'rgba(255, 255, 255, 0.38)' : 'rgba(255, 255, 255, 0.87)'
        : isDisabled ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.87)';

    // Checkbox colors
    const checkboxColor = isDisabled
        ? (darkMode ? 'rgba(255, 255, 255, 0.38)' : 'rgba(0, 0, 0, 0.38)')
        : (checked || indeterminate) ? activeColor : (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)');

    // Get the appropriate icon
    const getIcon = () => {
        if (indeterminate) {
            return <CheckboxIndeterminateIcon color={checkboxColor} size={currentSize.iconSize} />;
        }
        if (checked) {
            return <CheckboxCheckedIcon color={checkboxColor} size={currentSize.iconSize} />;
        }
        return <CheckboxUncheckedIcon color={checkboxColor} size={currentSize.iconSize} />;
    };

    // Hover/focus ring styles
    const getRingStyles = () => {
        if (state === 'Hovered' && !isDisabled) {
            return {
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            };
        }
        if (state === 'Focused' && !isDisabled) {
            return {
                backgroundColor: `${activeColor}14`,
            };
        }
        return {};
    };

    return (
        <div
            data-node-id={darkMode ? "checkbox:dark" : "checkbox:light"}
            data-figma-props={JSON.stringify({ color, size, state, checked, indeterminate, disabled, showLabel })}
        >
            <label
                className={`flex items-center ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
                {/* Checkbox with hover/focus ring */}
                <span
                    className="flex items-center justify-center rounded-full transition-colors"
                    style={{
                        width: currentSize.iconSize + currentSize.padding * 2,
                        height: currentSize.iconSize + currentSize.padding * 2,
                        ...getRingStyles(),
                    }}
                >
                    {getIcon()}
                </span>

                {/* Label */}
                {showLabel && (
                    <span
                        className="ml-2"
                        style={{
                            fontFamily: "'Roboto', sans-serif",
                            fontSize: `${currentSize.fontSize}px`,
                            lineHeight: 1.5,
                            color: textColor,
                        }}
                    >
                        {label}
                    </span>
                )}
            </label>
        </div>
    );
}

export default FigmaCheckbox;
