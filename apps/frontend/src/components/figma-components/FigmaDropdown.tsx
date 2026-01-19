'use client';
import React, { useState } from 'react';

// Chevron down icon
const ChevronDownIcon = ({ color = 'currentColor' }: { color?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z" fill={color} />
    </svg>
);

export interface DropdownOption {
    value: string;
    label: string;
}

export interface FigmaDropdownProps {
    label?: string;
    placeholder?: string;
    options?: DropdownOption[];
    selectedValue?: string;
    disabled?: boolean;
    darkMode?: boolean;
    expanded?: boolean;
    showIcon?: boolean;
    showHelperText?: boolean;
    state?: 'Enabled' | 'Hovered' | 'Focused';
}

/**
 * FigmaDropdown - Generated from Figma design
 * Supports both LightMode and DarkMode variants
 */
// Eye/View icon for dropdown
const ViewIcon = ({ color = 'currentColor' }: { color?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill={color}/>
    </svg>
);

export function FigmaDropdown({
    label = 'Label',
    placeholder = 'Select an option',
    options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' },
    ],
    selectedValue,
    disabled = false,
    darkMode = false,
    expanded = false,
    showIcon = true,
    showHelperText = true,
    state = 'Enabled',
}: FigmaDropdownProps) {
    const [isOpen, setIsOpen] = useState(expanded);

    // Apply state styling
    const isHovered = state === 'Hovered';
    const isFocused = state === 'Focused' || isOpen;

    // Colors based on mode
    const bgColor = darkMode ? '#1e1e1e' : 'white';
    const borderColor = darkMode ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)';
    const borderFocusColor = darkMode ? '#90caf9' : '#1976d2';
    const textPrimary = darkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
    const textSecondary = darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
    const labelColor = darkMode ? '#90caf9' : '#1976d2';
    const hoverBg = darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
    const dropdownBg = darkMode ? '#2d2d2d' : 'white';
    const shadowColor = darkMode
        ? '0px 5px 5px -3px rgba(0,0,0,0.4), 0px 8px 10px 1px rgba(0,0,0,0.28), 0px 3px 14px 2px rgba(0,0,0,0.24)'
        : '0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)';

    const selectedOption = options.find(opt => opt.value === selectedValue);

    return (
        <div
            data-node-id={darkMode ? "dropdown-dark" : "dropdown-light"}
            data-mode={darkMode ? "dark" : "light"}
            className="relative w-[280px]"
        >
            {/* Label */}
            <label
                className="block mb-1 text-xs"
                style={{
                    fontFamily: "'Roboto', sans-serif",
                    fontWeight: 400,
                    color: isFocused ? labelColor : textSecondary,
                }}
            >
                {label}
            </label>

            {/* Select trigger */}
            <div
                className={`
                    flex items-center gap-2
                    px-3 py-2 rounded
                    transition-colors cursor-pointer
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                style={{
                    backgroundColor: isHovered ? hoverBg : bgColor,
                    border: `1px solid ${isFocused ? borderFocusColor : borderColor}`,
                }}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                {/* Left Icon */}
                {showIcon && (
                    <div className="shrink-0">
                        <ViewIcon color={textSecondary} />
                    </div>
                )}
                <span
                    className="text-sm flex-1"
                    style={{
                        fontFamily: "'Roboto', sans-serif",
                        color: selectedOption ? textPrimary : textSecondary,
                    }}
                >
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div
                    className="transition-transform duration-200 shrink-0"
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                >
                    <ChevronDownIcon color={textSecondary} />
                </div>
            </div>

            {/* Helper Text */}
            {showHelperText && (
                <p
                    className="mt-1 text-xs"
                    style={{
                        fontFamily: "'Roboto', sans-serif",
                        color: textSecondary,
                    }}
                >
                    Helper text
                </p>
            )}

            {/* Dropdown menu */}
            {isOpen && !disabled && (
                <div
                    className="absolute top-full left-0 right-0 mt-1 rounded overflow-hidden z-10"
                    style={{
                        backgroundColor: dropdownBg,
                        boxShadow: shadowColor,
                    }}
                >
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className="px-4 py-2 cursor-pointer transition-colors"
                            style={{
                                backgroundColor: option.value === selectedValue ? hoverBg : 'transparent',
                                fontFamily: "'Roboto', sans-serif",
                                fontSize: '14px',
                                color: textPrimary,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = hoverBg;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    option.value === selectedValue ? hoverBg : 'transparent';
                            }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default FigmaDropdown;
