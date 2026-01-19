'use client';
import React from 'react';

export interface FigmaProgressBarProps {
    // Figma component properties (matching exact Figma schema)
    number?: boolean;      // Show/hide percentage number
    color?: 'Primary' | 'Secondary' | 'Error' | 'Warning' | 'Info' | 'Success';
    small?: 'True' | 'False'; // Size variant

    // Additional props for flexibility
    value?: number;        // 0-100 progress value
    darkMode?: boolean;    // Light/Dark mode
}

/**
 * FigmaProgressBar - Generated from Figma design
 * Matches ProgressLinear/LightMode component properties:
 * - number: boolean (show/hide percentage)
 * - color: "Primary" (color variant)
 * - small: "True" | "False" (size variant)
 */
export function FigmaProgressBar({
    number = true,
    color = 'Primary',
    small = 'False',
    value = 25,
    darkMode = false,
}: FigmaProgressBarProps) {
    // Clamp value between 0 and 100
    const clampedValue = Math.min(100, Math.max(0, value));

    // Size based on small prop
    const isSmall = small === 'True';
    const barHeight = isSmall ? 2 : 4;
    const containerWidth = isSmall ? 150 : 200;

    // Color palette based on Figma semantic tokens
    const colorPalette: Record<string, { main: string; track: string }> = {
        Primary: { main: '#1976d2', track: 'rgba(25, 118, 210, 0.3)' },
        Secondary: { main: '#9c27b0', track: 'rgba(156, 39, 176, 0.3)' },
        Error: { main: '#d32f2f', track: 'rgba(211, 47, 47, 0.3)' },
        Warning: { main: '#ed6c02', track: 'rgba(237, 108, 2, 0.3)' },
        Info: { main: '#0288d1', track: 'rgba(2, 136, 209, 0.3)' },
        Success: { main: '#2e7d32', track: 'rgba(46, 125, 50, 0.3)' },
    };

    const currentColor = colorPalette[color] || colorPalette.Primary;
    const trackColor = currentColor.track;
    const progressColor = currentColor.main;
    const textColor = darkMode
        ? 'rgba(255, 255, 255, 0.87)'
        : 'rgba(0, 0, 0, 0.87)';

    return (
        <div
            data-node-id="15:5698"
            data-figma-props={JSON.stringify({ number, color, small })}
            className="flex items-center gap-2"
            style={{ width: containerWidth }}
        >
            {/* Progress Bar Track */}
            <div
                className="relative flex-1 rounded-full overflow-hidden"
                style={{
                    height: barHeight,
                    backgroundColor: trackColor,
                }}
            >
                {/* Progress Fill */}
                <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-300 ease-out"
                    style={{
                        backgroundColor: progressColor,
                        width: `${clampedValue}%`,
                    }}
                />
            </div>

            {/* Percentage Number */}
            {number && (
                <span
                    className="shrink-0 text-sm"
                    style={{
                        fontFamily: "'Roboto', sans-serif",
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: 1.43,
                        letterSpacing: '0.17px',
                        color: textColor,
                    }}
                >
                    {clampedValue}%
                </span>
            )}
        </div>
    );
}

export default FigmaProgressBar;
