'use client';
import React from 'react';

export interface FigmaTextAreaProps {
    label?: string;
    placeholder?: string;
    value?: string;
    helperText?: string;
    errorText?: string;
    darkMode?: boolean;
    // Variant properties
    variant?: 'Outlined' | 'Filled';
    state?: 'Enabled' | 'Hovered' | 'Focused' | 'Disabled' | 'Error';
    // Boolean properties
    showLabel?: boolean;
    showHelperText?: boolean;
    showCharCount?: boolean;
    required?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    // Size properties
    rows?: number;
    maxLength?: number;
}

/**
 * FigmaTextArea - Multi-line text input component
 * Supports LightMode and DarkMode variants
 *
 * Properties:
 * - variant: Outlined, Filled
 * - state: Enabled, Hovered, Focused, Disabled, Error
 * - rows: Number of visible rows
 */
export function FigmaTextArea({
    label = 'Label',
    placeholder = 'Body text (optional)',
    value = '',
    helperText = 'Helper text',
    errorText = 'Error message',
    darkMode = false,
    variant = 'Outlined',
    state = 'Enabled',
    showLabel = true,
    showHelperText = false,
    showCharCount = false,
    required = false,
    disabled = false,
    fullWidth = false,
    rows = 4,
    maxLength = 300,
}: FigmaTextAreaProps) {
    const [charCount, setCharCount] = React.useState(value.length);
    const isDisabled = disabled || state === 'Disabled';
    const isError = state === 'Error';
    const isFocused = state === 'Focused';

    // Colors based on state and mode
    const colors = {
        border: isError ? '#d32f2f' : isFocused ? '#1976d2' : darkMode ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
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
    };

    const currentVariant = variantStyles[variant] || variantStyles.Outlined;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCharCount(e.target.value.length);
    };

    return (
        <div
            data-node-id={darkMode ? "textarea:dark" : "textarea:light"}
            data-figma-props={JSON.stringify({ variant, state, showLabel, showHelperText, showCharCount, required, rows })}
            className={`flex flex-col gap-[4px] ${fullWidth ? 'w-full' : 'w-[400px]'}`}
        >
            {/* Label */}
            {showLabel && (
                <label
                    className="text-[12px] font-normal"
                    style={{ color: colors.label, fontFamily: "'Roboto', sans-serif" }}
                >
                    {label}
                    {required && <span style={{ color: '#d32f2f' }}>*</span>}
                </label>
            )}

            {/* TextArea Container */}
            <div
                className={`
                    ${currentVariant.container}
                    ${isDisabled ? 'opacity-50' : ''}
                    transition-all duration-200
                `}
                style={currentVariant.borderStyle}
            >
                <textarea
                    placeholder={placeholder}
                    defaultValue={value}
                    disabled={isDisabled}
                    rows={rows}
                    maxLength={maxLength}
                    onChange={handleChange}
                    className={`
                        w-full
                        px-[14px] py-[16px]
                        text-[16px]
                        bg-transparent
                        outline-none
                        resize-y
                        ${isDisabled ? 'cursor-not-allowed' : ''}
                    `}
                    style={{
                        color: colors.text,
                        fontFamily: "'Roboto', sans-serif",
                        minHeight: `${rows * 24}px`,
                    }}
                />
            </div>

            {/* Helper Text / Character Count Row */}
            <div className="flex justify-between px-[14px]">
                {showHelperText && (
                    <span
                        className="text-[12px]"
                        style={{ color: colors.helper, fontFamily: "'Roboto', sans-serif" }}
                    >
                        {isError ? errorText : helperText}
                    </span>
                )}
                {showCharCount && (
                    <span
                        className="text-[12px] ml-auto"
                        style={{ color: colors.helper, fontFamily: "'Roboto', sans-serif" }}
                    >
                        {charCount}/{maxLength}
                    </span>
                )}
            </div>
        </div>
    );
}

export default FigmaTextArea;
