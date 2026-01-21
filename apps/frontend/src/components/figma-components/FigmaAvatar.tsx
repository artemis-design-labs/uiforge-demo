'use client';
import React from 'react';
import { PersonIcon } from './FigmaIcons';

export interface FigmaAvatarProps {
    // TEXT properties
    initials?: string;
    alt?: string;
    // VARIANT properties
    size?: 'Small' | 'Medium' | 'Large';
    variant?: 'Circular' | 'Rounded' | 'Square';
    color?: 'Primary' | 'Secondary' | 'Error' | 'Warning' | 'Info' | 'Success';
    // BOOLEAN properties
    showImage?: boolean;
    showIcon?: boolean;
    // Mode
    darkMode?: boolean;
}

/**
 * FigmaAvatar - Avatar component from Figma design
 * Supports different sizes, shapes, and content types
 */
export function FigmaAvatar({
    initials = 'AB',
    alt = 'Avatar',
    size = 'Medium',
    variant = 'Circular',
    color = 'Primary',
    showImage = false,
    showIcon = false,
    darkMode = false,
}: FigmaAvatarProps) {
    // Size configurations
    const sizeConfig = {
        Small: { size: 32, fontSize: 14, iconSize: 18 },
        Medium: { size: 40, fontSize: 16, iconSize: 22 },
        Large: { size: 56, fontSize: 20, iconSize: 28 },
    };

    // Color configurations
    const colorConfig: Record<string, { bg: string; text: string }> = {
        Primary: { bg: '#1976d2', text: '#ffffff' },
        Secondary: { bg: '#9c27b0', text: '#ffffff' },
        Error: { bg: '#d32f2f', text: '#ffffff' },
        Warning: { bg: '#ed6c02', text: '#ffffff' },
        Info: { bg: '#0288d1', text: '#ffffff' },
        Success: { bg: '#2e7d32', text: '#ffffff' },
    };

    // Border radius based on variant
    const borderRadiusMap = {
        Circular: '50%',
        Rounded: '8px',
        Square: '0px',
    };

    const currentSize = sizeConfig[size] || sizeConfig.Medium;
    const currentColor = colorConfig[color] || colorConfig.Primary;
    const borderRadius = borderRadiusMap[variant] || borderRadiusMap.Circular;

    // Dark mode adjustments
    const bgColor = darkMode ? currentColor.bg : currentColor.bg;
    const textColor = currentColor.text;

    // Render content based on props
    const renderContent = () => {
        if (showImage) {
            // Placeholder for image - in real implementation, would use actual image URL
            return (
                <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                        backgroundColor: darkMode ? '#424242' : '#bdbdbd',
                    }}
                >
                    <PersonIcon color={darkMode ? '#fff' : '#757575'} size={currentSize.iconSize} />
                </div>
            );
        }

        if (showIcon) {
            return <PersonIcon color={textColor} size={currentSize.iconSize} />;
        }

        // Show initials
        return (
            <span
                style={{
                    fontFamily: "'Roboto', sans-serif",
                    fontSize: `${currentSize.fontSize}px`,
                    fontWeight: 500,
                    color: textColor,
                    lineHeight: 1,
                }}
            >
                {initials.slice(0, 2).toUpperCase()}
            </span>
        );
    };

    return (
        <div
            data-node-id={darkMode ? "avatar:dark" : "avatar:light"}
            data-figma-props={JSON.stringify({ size, variant, color, showImage, showIcon })}
        >
            <div
                className="flex items-center justify-center overflow-hidden"
                style={{
                    width: `${currentSize.size}px`,
                    height: `${currentSize.size}px`,
                    borderRadius,
                    backgroundColor: bgColor,
                }}
                title={alt}
            >
                {renderContent()}
            </div>
        </div>
    );
}

export default FigmaAvatar;
