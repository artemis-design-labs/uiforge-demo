'use client';
import React from 'react';

// Chevron icon (pointing down for collapsed state)
const ChevronIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z" fill="currentColor"/>
    </svg>
);

export interface FigmaAccordionDarkModeProps {
    className?: string;
    heading?: string;
    secondaryHeading?: string;
    showSecondaryHeading?: boolean;
}

/**
 * FigmaAccordionDarkMode - Generated from Figma design
 * Node ID: 1:46
 * Variant: Expanded=False, Disabled=False, First-of-type=False, Last-of-type=False
 *
 * This component matches the exact visual design from Figma's Accordion/DarkMode component set
 */
export function FigmaAccordionDarkMode({
    className = '',
    heading = 'Heading',
    secondaryHeading = 'Secondary heading',
    showSecondaryHeading = true,
}: FigmaAccordionDarkModeProps) {
    return (
        <div
            data-node-id="1:46"
            className={`${className}`}
        >
            {/* AccordionTextSummary/LM - Main container */}
            <div
                data-node-id="1:47"
                className="bg-white flex flex-col items-start overflow-hidden w-[600px]"
                style={{
                    boxShadow: '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)'
                }}
            >
                {/* Accordion Summary Row */}
                <div
                    data-node-id="1:48"
                    className="flex items-center w-full"
                >
                    {/* Accordion Expand Icon */}
                    <div
                        data-node-id="1:49"
                        className="flex items-center justify-center"
                    >
                        <div className="flex items-center justify-center w-[48px] h-[48px]">
                            {/* Icon rotated 270deg (pointing down) */}
                            <div
                                data-node-id="1:50"
                                className="flex flex-col items-start"
                                style={{ transform: 'rotate(270deg)' }}
                            >
                                <div className="flex items-center p-[12px] rounded-full">
                                    <div className="w-[24px] h-[24px] text-black/87">
                                        <ChevronIcon />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Primary Heading Text */}
                    <div
                        data-node-id="1:51"
                        className="flex-1 flex flex-col items-start py-[12px]"
                    >
                        <p
                            data-node-id="1:52"
                            className="w-full text-left whitespace-pre-wrap"
                            style={{
                                fontFamily: "'Roboto', sans-serif",
                                fontWeight: 400,
                                fontSize: '16px',
                                lineHeight: 1.5,
                                letterSpacing: '0.15px',
                                color: 'rgba(0, 0, 0, 0.87)'
                            }}
                        >
                            {heading}
                        </p>
                    </div>

                    {/* Secondary Heading Text */}
                    <div
                        data-node-id="1:53"
                        className="flex-1 flex flex-col items-start py-[12px]"
                    >
                        {showSecondaryHeading && (
                            <p
                                data-node-id="1:54"
                                className="w-full text-left whitespace-pre-wrap"
                                style={{
                                    fontFamily: "'Roboto', sans-serif",
                                    fontWeight: 400,
                                    fontSize: '16px',
                                    lineHeight: 1.5,
                                    letterSpacing: '0.15px',
                                    color: 'rgba(0, 0, 0, 0.6)'
                                }}
                            >
                                {secondaryHeading}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FigmaAccordionDarkMode;
