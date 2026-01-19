'use client';
import React from 'react';

export interface FigmaProgressBarProps {
    value?: number; // 0-100
    label?: string;
    showLabel?: boolean;
    showPercentage?: boolean;
    darkMode?: boolean;
    variant?: 'linear' | 'determinate' | 'indeterminate';
    color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
}

/**
 * FigmaProgressBar - Generated from Figma design
 * Supports both LightMode and DarkMode variants
 */
export function FigmaProgressBar({
    value = 60,
    label = 'Progress',
    showLabel = true,
    showPercentage = true,
    darkMode = false,
    variant = 'determinate',
    color = 'primary',
}: FigmaProgressBarProps) {
    // Clamp value between 0 and 100
    const clampedValue = Math.min(100, Math.max(0, value));

    // Colors based on mode
    const bgColor = darkMode ? '#1e1e1e' : 'white';
    const trackColor = darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
    const textPrimary = darkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
    const textSecondary = darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

    // Progress bar color based on color prop and mode
    const getProgressColor = () => {
        const colors = {
            primary: darkMode ? '#90caf9' : '#1976d2',
            secondary: darkMode ? '#ce93d8' : '#9c27b0',
            success: darkMode ? '#81c784' : '#2e7d32',
            error: darkMode ? '#f48fb1' : '#d32f2f',
            warning: darkMode ? '#ffb74d' : '#ed6c02',
        };
        return colors[color];
    };

    const progressColor = getProgressColor();

    return (
        <div
            data-node-id={darkMode ? "progressbar-dark" : "progressbar-light"}
            data-mode={darkMode ? "dark" : "light"}
            className="w-[300px]"
            style={{ backgroundColor: bgColor, padding: '12px', borderRadius: '4px' }}
        >
            {/* Label row */}
            {(showLabel || showPercentage) && (
                <div className="flex items-center justify-between mb-2">
                    {showLabel && (
                        <span
                            className="text-sm"
                            style={{
                                fontFamily: "'Roboto', sans-serif",
                                fontWeight: 400,
                                color: textPrimary,
                            }}
                        >
                            {label}
                        </span>
                    )}
                    {showPercentage && (
                        <span
                            className="text-sm"
                            style={{
                                fontFamily: "'Roboto', sans-serif",
                                fontWeight: 400,
                                color: textSecondary,
                            }}
                        >
                            {clampedValue}%
                        </span>
                    )}
                </div>
            )}

            {/* Progress track */}
            <div
                className="relative h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: trackColor }}
            >
                {/* Progress fill */}
                {variant === 'indeterminate' ? (
                    <div
                        className="absolute h-full rounded-full animate-progress-indeterminate"
                        style={{
                            backgroundColor: progressColor,
                            width: '30%',
                            animation: 'indeterminate 1.5s ease-in-out infinite',
                        }}
                    />
                ) : (
                    <div
                        className="h-full rounded-full transition-all duration-300 ease-out"
                        style={{
                            backgroundColor: progressColor,
                            width: `${clampedValue}%`,
                        }}
                    />
                )}
            </div>

            {/* Inline keyframes for indeterminate animation */}
            {variant === 'indeterminate' && (
                <style jsx>{`
                    @keyframes indeterminate {
                        0% {
                            left: -30%;
                        }
                        100% {
                            left: 100%;
                        }
                    }
                `}</style>
            )}
        </div>
    );
}

export default FigmaProgressBar;
