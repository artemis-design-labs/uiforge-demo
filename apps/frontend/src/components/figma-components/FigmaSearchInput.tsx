'use client';
import React from 'react';
import { SearchIcon, CloseIcon } from './FigmaIcons';

export interface FigmaSearchInputProps {
    placeholder?: string;
    value?: string;
    darkMode?: boolean;
    // Variant properties
    variant?: 'Outlined' | 'Filled';
    size?: 'Small' | 'Medium';
    state?: 'Enabled' | 'Hovered' | 'Focused' | 'Disabled';
    // Boolean properties
    showClearButton?: boolean;
    fullWidth?: boolean;
    disabled?: boolean;
}

/**
 * FigmaSearchInput - Search input with icon component
 * Supports LightMode and DarkMode variants
 *
 * Properties:
 * - variant: Outlined, Filled
 * - size: Small, Medium
 * - state: Enabled, Hovered, Focused, Disabled
 * - showClearButton: Show clear/X button when has value
 */
export function FigmaSearchInput({
    placeholder = 'Search',
    value = '',
    darkMode = false,
    variant = 'Filled',
    size = 'Medium',
    state = 'Enabled',
    showClearButton = true,
    fullWidth = false,
    disabled = false,
}: FigmaSearchInputProps) {
    const [inputValue, setInputValue] = React.useState(value);
    const isDisabled = disabled || state === 'Disabled';
    const isFocused = state === 'Focused';
    const isHovered = state === 'Hovered';

    // Size configurations
    const sizeConfig = {
        Small: { height: 'h-[36px]', padding: 'pl-[36px] pr-[12px]', iconSize: 'w-[18px] h-[18px]', iconLeft: 'left-[10px]', fontSize: 'text-[14px]' },
        Medium: { height: 'h-[44px]', padding: 'pl-[44px] pr-[14px]', iconSize: 'w-[20px] h-[20px]', iconLeft: 'left-[12px]', fontSize: 'text-[16px]' },
    };

    const currentSize = sizeConfig[size] || sizeConfig.Medium;

    // Colors based on state and mode
    const colors = {
        border: isFocused ? '#1976d2' : (darkMode ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)'),
        background: variant === 'Filled'
            ? (darkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)')
            : 'transparent',
        backgroundHover: variant === 'Filled'
            ? (darkMode ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.09)')
            : 'transparent',
        text: darkMode ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
        placeholder: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.42)',
        icon: darkMode ? 'rgba(255,255,255,0.54)' : 'rgba(0,0,0,0.54)',
    };

    const handleClear = () => {
        setInputValue('');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    return (
        <div
            data-node-id={darkMode ? "searchinput:dark" : "searchinput:light"}
            data-figma-props={JSON.stringify({ variant, size, state, showClearButton })}
            className={`relative ${fullWidth ? 'w-full' : 'w-[300px]'}`}
        >
            {/* Search Icon */}
            <div
                className={`absolute ${currentSize.iconLeft} top-1/2 -translate-y-1/2 ${currentSize.iconSize} flex items-center justify-center pointer-events-none`}
            >
                <SearchIcon color={colors.icon} />
            </div>

            {/* Input */}
            <input
                type="text"
                placeholder={placeholder}
                value={inputValue}
                onChange={handleChange}
                disabled={isDisabled}
                className={`
                    w-full
                    ${currentSize.height}
                    ${currentSize.padding}
                    ${showClearButton && inputValue ? 'pr-[40px]' : ''}
                    ${currentSize.fontSize}
                    ${variant === 'Outlined' ? 'border rounded-[4px]' : 'rounded-full'}
                    ${isFocused && variant === 'Outlined' ? 'border-2' : ''}
                    outline-none
                    transition-all duration-200
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                style={{
                    backgroundColor: isHovered && !isFocused ? colors.backgroundHover : colors.background,
                    borderColor: variant === 'Outlined' ? colors.border : undefined,
                    color: colors.text,
                    fontFamily: "'Roboto', sans-serif",
                }}
            />

            {/* Clear Button */}
            {showClearButton && inputValue && !isDisabled && (
                <button
                    onClick={handleClear}
                    className="absolute right-[10px] top-1/2 -translate-y-1/2 w-[20px] h-[20px] flex items-center justify-center rounded-full hover:bg-black/10 transition-colors"
                    style={{ color: colors.icon }}
                >
                    <CloseIcon color={colors.icon} />
                </button>
            )}
        </div>
    );
}

export default FigmaSearchInput;
