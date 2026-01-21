'use client';
import React from 'react';

export interface FigmaBadgeProps {
    // TEXT properties
    content?: string;
    // VARIANT properties
    color?: 'Primary' | 'Secondary' | 'Error' | 'Warning' | 'Info' | 'Success';
    variant?: 'Standard' | 'Dot';
    position?: 'Top Right' | 'Top Left' | 'Bottom Right' | 'Bottom Left';
    size?: 'Small' | 'Medium' | 'Large';
    // BOOLEAN properties
    showBadge?: boolean;
    showZero?: boolean;
    // Mode
    darkMode?: boolean;
    // Children (the element to badge)
    children?: React.ReactNode;
}

/**
 * FigmaBadge - Badge component from Figma design
 * Displays a small badge on its children
 */
export function FigmaBadge({
    content = '4',
    color = 'Primary',
    variant = 'Standard',
    position = 'Top Right',
    size = 'Medium',
    showBadge = true,
    showZero = false,
    darkMode = false,
    children,
}: FigmaBadgeProps) {
    // Color configurations
    const colorConfig: Record<string, { bg: string; text: string }> = {
        Primary: { bg: '#1976d2', text: '#ffffff' },
        Secondary: { bg: '#9c27b0', text: '#ffffff' },
        Error: { bg: '#d32f2f', text: '#ffffff' },
        Warning: { bg: '#ed6c02', text: '#ffffff' },
        Info: { bg: '#0288d1', text: '#ffffff' },
        Success: { bg: '#2e7d32', text: '#ffffff' },
    };

    // Size configurations
    const sizeConfig = {
        Small: { height: 16, minWidth: 16, fontSize: 10, dotSize: 6 },
        Medium: { height: 20, minWidth: 20, fontSize: 12, dotSize: 8 },
        Large: { height: 24, minWidth: 24, fontSize: 14, dotSize: 10 },
    };

    // Position configurations
    const positionConfig: Record<string, { top?: string; bottom?: string; left?: string; right?: string; transform: string }> = {
        'Top Right': { top: '0', right: '0', transform: 'translate(50%, -50%)' },
        'Top Left': { top: '0', left: '0', transform: 'translate(-50%, -50%)' },
        'Bottom Right': { bottom: '0', right: '0', transform: 'translate(50%, 50%)' },
        'Bottom Left': { bottom: '0', left: '0', transform: 'translate(-50%, 50%)' },
    };

    const currentColor = colorConfig[color] || colorConfig.Primary;
    const currentSize = sizeConfig[size] || sizeConfig.Medium;
    const currentPosition = positionConfig[position] || positionConfig['Top Right'];

    // Determine if badge should be shown
    const numContent = parseInt(content, 10);
    const shouldShow = showBadge && (showZero || numContent !== 0 || isNaN(numContent));

    // Default child if none provided
    const defaultChild = (
        <div
            className="flex items-center justify-center"
            style={{
                width: 40,
                height: 40,
                backgroundColor: darkMode ? '#424242' : '#e0e0e0',
                borderRadius: 4,
            }}
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={darkMode ? '#fff' : '#757575'}>
                <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" />
            </svg>
        </div>
    );

    return (
        <div
            data-node-id={darkMode ? "badge:dark" : "badge:light"}
            data-figma-props={JSON.stringify({ color, variant, position, size, showBadge, showZero })}
            className="relative inline-flex"
        >
            {children || defaultChild}

            {shouldShow && (
                <span
                    className="absolute flex items-center justify-center"
                    style={{
                        ...currentPosition,
                        backgroundColor: currentColor.bg,
                        color: currentColor.text,
                        height: variant === 'Dot' ? currentSize.dotSize : currentSize.height,
                        minWidth: variant === 'Dot' ? currentSize.dotSize : currentSize.minWidth,
                        borderRadius: 999,
                        fontSize: currentSize.fontSize,
                        fontFamily: "'Roboto', sans-serif",
                        fontWeight: 500,
                        padding: variant === 'Dot' ? 0 : '0 6px',
                        lineHeight: 1,
                    }}
                >
                    {variant !== 'Dot' && content}
                </span>
            )}
        </div>
    );
}

export default FigmaBadge;
