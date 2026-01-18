'use client';
import React from 'react';

// Arrow Left Icon
const ArrowLeftIcon = ({ color = 'currentColor' }: { color?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill={color} />
    </svg>
);

// Arrow Right Icon
const ArrowRightIcon = ({ color = 'currentColor' }: { color?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 11H16.17L10.58 5.41L12 4L20 12L12 20L10.59 18.59L16.17 13H4V11Z" fill={color} />
    </svg>
);

export interface FigmaButtonProps {
    label?: string;
    darkMode?: boolean;
    showLeftIcon?: boolean;
    showRightIcon?: boolean;
    disabled?: boolean;
}

/**
 * FigmaButton - Generated from Figma design
 * Supports LightMode and DarkMode variants
 *
 * LightMode: Blue background (#1976d2), white text
 * DarkMode: Light blue background (#90caf9), dark text
 */
export function FigmaButton({
    label = 'Button',
    darkMode = false,
    showLeftIcon = true,
    showRightIcon = true,
    disabled = false,
}: FigmaButtonProps) {
    // Colors based on mode
    const bgColor = darkMode ? '#90caf9' : '#1976d2';
    const textColor = darkMode ? 'rgba(0, 0, 0, 0.87)' : 'white';

    return (
        <div
            data-node-id={darkMode ? "14:3738" : "14:3737"}
            className="flex items-start"
        >
            <button
                disabled={disabled}
                className={`
                    flex items-center justify-center
                    h-[40px] px-[22px] py-[8px]
                    rounded-[4px] overflow-hidden
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}
                    transition-opacity
                `}
                style={{ backgroundColor: bgColor }}
            >
                <div className="flex items-center gap-[8px]">
                    {/* Left Arrow Icon */}
                    {showLeftIcon && (
                        <div className="w-[24px] h-[24px] flex items-center justify-center">
                            <ArrowLeftIcon color={textColor} />
                        </div>
                    )}

                    {/* Button Label */}
                    <span
                        className="text-[16px] font-normal leading-[1.5] tracking-[0.15px]"
                        style={{
                            fontFamily: "'Roboto', sans-serif",
                            color: textColor,
                        }}
                    >
                        {label}
                    </span>

                    {/* Right Arrow Icon */}
                    {showRightIcon && (
                        <div className="w-[24px] h-[24px] flex items-center justify-center">
                            <ArrowRightIcon color={textColor} />
                        </div>
                    )}
                </div>
            </button>
        </div>
    );
}

export default FigmaButton;
