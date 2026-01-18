'use client';
import React from 'react';

// Chevron icon (pointing down for collapsed state)
const ChevronIcon = ({ color = 'currentColor' }: { color?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z" fill={color}/>
    </svg>
);

// Chevron Up icon (for expanded state)
const ChevronUpIcon = ({ color = 'currentColor' }: { color?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.41 15.41L12 10.83L16.59 15.41L18 14L12 8L6 14L7.41 15.41Z" fill={color}/>
    </svg>
);

export interface FigmaAccordionProps {
    heading?: string;
    secondaryHeading?: string;
    content?: string;
    expanded?: boolean;
    disabled?: boolean;
    darkMode?: boolean;
}

/**
 * FigmaAccordion - Generated from Figma design
 * Supports both LightMode and DarkMode variants
 *
 * LightMode: White background, dark text (for light app themes)
 * DarkMode: Dark background, light text (for dark app themes)
 */
export function FigmaAccordion({
    heading = 'Heading',
    secondaryHeading = 'Secondary heading',
    content = 'This is the accordion content that appears when expanded.',
    expanded = false,
    disabled = false,
    darkMode = false,
}: FigmaAccordionProps) {
    // Colors based on mode
    const bgColor = darkMode ? '#1e1e1e' : 'white';
    const textPrimary = darkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
    const textSecondary = darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
    const iconColor = darkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
    const shadowColor = darkMode
        ? '0px 2px 1px -1px rgba(0,0,0,0.4), 0px 1px 1px 0px rgba(0,0,0,0.3), 0px 1px 3px 0px rgba(0,0,0,0.24)'
        : '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)';

    return (
        <div
            data-node-id={darkMode ? "1:46" : "1:136"}
            data-mode={darkMode ? "dark" : "light"}
        >
            {/* Main container */}
            <div
                className={`flex flex-col items-start overflow-hidden w-[600px] ${disabled ? 'opacity-50' : ''}`}
                style={{
                    backgroundColor: bgColor,
                    boxShadow: shadowColor,
                }}
            >
                {/* Accordion Summary Row */}
                <div className="flex items-center w-full cursor-pointer">
                    {/* Expand Icon */}
                    <div className="flex items-center justify-center w-[48px] h-[48px]">
                        {expanded ? (
                            <ChevronUpIcon color={iconColor} />
                        ) : (
                            <ChevronIcon color={iconColor} />
                        )}
                    </div>

                    {/* Primary Heading Text */}
                    <div className="flex-1 flex flex-col items-start py-[12px]">
                        <p
                            className="w-full text-left whitespace-pre-wrap"
                            style={{
                                fontFamily: "'Roboto', sans-serif",
                                fontWeight: 400,
                                fontSize: '16px',
                                lineHeight: 1.5,
                                letterSpacing: '0.15px',
                                color: disabled ? textSecondary : textPrimary,
                            }}
                        >
                            {heading}
                        </p>
                    </div>

                    {/* Secondary Heading Text */}
                    <div className="flex-1 flex flex-col items-start py-[12px]">
                        <p
                            className="w-full text-left whitespace-pre-wrap"
                            style={{
                                fontFamily: "'Roboto', sans-serif",
                                fontWeight: 400,
                                fontSize: '16px',
                                lineHeight: 1.5,
                                letterSpacing: '0.15px',
                                color: textSecondary,
                            }}
                        >
                            {secondaryHeading}
                        </p>
                    </div>
                </div>

                {/* Content (only shown when expanded and not disabled) */}
                {expanded && !disabled && (
                    <div className="px-[48px] py-[12px] w-full">
                        <p
                            className="w-full text-left whitespace-pre-wrap"
                            style={{
                                fontFamily: "'Roboto', sans-serif",
                                fontWeight: 400,
                                fontSize: '16px',
                                lineHeight: 1.5,
                                letterSpacing: '0.15px',
                                color: textPrimary,
                            }}
                        >
                            {content}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FigmaAccordion;
