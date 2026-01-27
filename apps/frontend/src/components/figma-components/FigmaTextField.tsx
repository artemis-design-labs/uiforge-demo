'use client';
import React from 'react';

export interface FigmaTextFieldProps {
    label?: string;
    placeholder?: string;
    value?: string;
    helperText?: string;
    errorText?: string;
    darkMode?: boolean;
    // Variant properties
    variant?: 'Outlined' | 'Filled' | 'Standard';
    size?: 'Small' | 'Medium';
    state?: 'Enabled' | 'Hovered' | 'Focused' | 'Disabled' | 'Error';
    // Boolean properties
    showLabel?: boolean;
    showHelperText?: boolean;
    required?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
}

/**
 * FigmaTextField - Text input component
 * Supports LightMode and DarkMode variants
 *
 * Properties:
 * - variant: Outlined, Filled, Standard
 * - size: Small, Medium
 * - state: Enabled, Hovered, Focused, Disabled, Error
 */
export function FigmaTextField({
    label = 'Label',
    placeholder = 'Placeholder',
    value = '',
    helperText = 'Helper text',
    errorText = 'Error message',
    darkMode = false,
    variant = 'Outlined',
    size = 'Medium',
    state = 'Enabled',
    showLabel = true,
    showHelperText = false,
    required = false,
    disabled = false,
    fullWidth = false,
}: FigmaTextFieldProps) {
    const isDisabled = disabled || state === 'Disabled';
    const isError = state === 'Error';
    const isFocused = state === 'Focused';

    // Size configurations
    const sizeConfig = {
        Small: { height: 'h-[40px]', padding: 'px-[12px] py-[8px]', fontSize: 'text-[14px]', labelSize: 'text-[12px]' },
        Medium: { height: 'h-[56px]', padding: 'px-[14px] py-[16px]', fontSize: 'text-[16px]', labelSize: 'text-[12px]' },
    };

    const currentSize = sizeConfig[size] || sizeConfig.Medium;

    // Colors based on state and mode
    const colors = {
        border: isError ? '#d32f2f' : isFocused ? '#1976d2' : darkMode ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
        borderHover: isError ? '#d32f2f' : darkMode ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
        label: isError ? '#d32f2f' : isFocused ? '#1976d2' : darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
        text: darkMode ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
        placeholder: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.42)',
        helper: isError ? '#d32f2f' : darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
        background: variant === 'Filled' ? (darkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)') : 'transparent',
    };

    // Variant-specific styles
    const variantStyles = {
        Outlined: {
            container: `border rounded-[4px] ${isFocused ? 'border-2' : 'border'}`,
            borderStyle: { borderColor: colors.border },
        },
        Filled: {
            container: 'rounded-t-[4px] border-b-2',
            borderStyle: { borderColor: colors.border, backgroundColor: colors.background },
        },
        Standard: {
            container: 'border-b',
            borderStyle: { borderColor: colors.border },
        },
    };

    const currentVariant = variantStyles[variant] || variantStyles.Outlined;

    return (
        <div
            data-node-id={darkMode ? "textfield:dark" : "textfield:light"}
            data-figma-props={JSON.stringify({ variant, size, state, showLabel, showHelperText, required })}
            className={`flex flex-col gap-[4px] ${fullWidth ? 'w-full' : 'w-[280px]'}`}
        >
            {/* Label */}
            {showLabel && (
                <label
                    className={`${currentSize.labelSize} font-normal`}
                    style={{ color: colors.label, fontFamily: "'Roboto', sans-serif" }}
                >
                    {label}
                    {required && <span style={{ color: '#d32f2f' }}>*</span>}
                </label>
            )}

            {/* Input Container */}
            <div
                className={`
                    ${currentVariant.container}
                    ${currentSize.height}
                    ${isDisabled ? 'opacity-50' : ''}
                    transition-all duration-200
                    ${state === 'Hovered' && !isDisabled ? 'hover:border-opacity-100' : ''}
                `}
                style={currentVariant.borderStyle}
            >
                <input
                    type="text"
                    placeholder={placeholder}
                    defaultValue={value}
                    disabled={isDisabled}
                    className={`
                        w-full h-full
                        ${currentSize.padding}
                        ${currentSize.fontSize}
                        bg-transparent
                        outline-none
                        ${isDisabled ? 'cursor-not-allowed' : ''}
                    `}
                    style={{
                        color: colors.text,
                        fontFamily: "'Roboto', sans-serif",
                    }}
                />
            </div>

            {/* Helper/Error Text */}
            {showHelperText && (
                <span
                    className="text-[12px] px-[14px]"
                    style={{ color: colors.helper, fontFamily: "'Roboto', sans-serif" }}
                >
                    {isError ? errorText : helperText}
                </span>
            )}
        </div>
    );
}

export default FigmaTextField;
