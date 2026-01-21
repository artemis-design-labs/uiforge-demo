'use client';
import React from 'react';
import { CloseIcon, getIconByName } from './FigmaIcons';

export interface FigmaChipProps {
    // TEXT properties
    label?: string;
    // VARIANT properties
    color?: 'Primary' | 'Secondary' | 'Error' | 'Warning' | 'Info' | 'Success' | 'Default';
    variant?: 'Filled' | 'Outlined';
    size?: 'Small' | 'Medium';
    state?: 'Enabled' | 'Hovered' | 'Focused' | 'Disabled';
    // BOOLEAN properties
    disabled?: boolean;
    deletable?: boolean;
    clickable?: boolean;
    showIcon?: boolean;
    showAvatar?: boolean;
    // INSTANCE_SWAP properties
    icon?: string;
    // Mode
    darkMode?: boolean;
}

/**
 * FigmaChip - Chip component from Figma design
 * Supports different colors, sizes, and interactive states
 */
export function FigmaChip({
    label = 'Chip',
    color = 'Default',
    variant = 'Filled',
    size = 'Medium',
    state = 'Enabled',
    disabled = false,
    deletable = false,
    clickable = false,
    showIcon = false,
    showAvatar = false,
    icon,
    darkMode = false,
}: FigmaChipProps) {
    // Size configurations
    const sizeConfig = {
        Small: { height: 24, fontSize: 12, iconSize: 16, padding: '0 8px', avatarSize: 18 },
        Medium: { height: 32, fontSize: 13, iconSize: 18, padding: '0 12px', avatarSize: 24 },
    };

    // Color configurations
    const colorConfig: Record<string, { main: string; light: string; contrastText: string }> = {
        Primary: { main: '#1976d2', light: '#e3f2fd', contrastText: '#ffffff' },
        Secondary: { main: '#9c27b0', light: '#f3e5f5', contrastText: '#ffffff' },
        Error: { main: '#d32f2f', light: '#ffebee', contrastText: '#ffffff' },
        Warning: { main: '#ed6c02', light: '#fff3e0', contrastText: '#ffffff' },
        Info: { main: '#0288d1', light: '#e1f5fe', contrastText: '#ffffff' },
        Success: { main: '#2e7d32', light: '#e8f5e9', contrastText: '#ffffff' },
        Default: { main: '#616161', light: '#f5f5f5', contrastText: '#ffffff' },
    };

    const currentSize = sizeConfig[size] || sizeConfig.Medium;
    const currentColor = colorConfig[color] || colorConfig.Default;

    // Determine if disabled from state or disabled prop
    const isDisabled = disabled || state === 'Disabled';
    const isClickable = clickable && !isDisabled;

    // Calculate colors based on variant and mode
    let bgColor: string;
    let textColor: string;
    let borderColor: string | undefined;

    if (darkMode) {
        if (variant === 'Filled') {
            bgColor = isDisabled ? 'rgba(255, 255, 255, 0.12)' : currentColor.main;
            textColor = isDisabled ? 'rgba(255, 255, 255, 0.3)' : currentColor.contrastText;
        } else {
            // Outlined
            bgColor = 'transparent';
            borderColor = isDisabled ? 'rgba(255, 255, 255, 0.12)' : currentColor.main;
            textColor = isDisabled ? 'rgba(255, 255, 255, 0.3)' : currentColor.main;
        }
    } else {
        if (variant === 'Filled') {
            if (color === 'Default') {
                bgColor = isDisabled ? 'rgba(0, 0, 0, 0.12)' : '#e0e0e0';
                textColor = isDisabled ? 'rgba(0, 0, 0, 0.26)' : 'rgba(0, 0, 0, 0.87)';
            } else {
                bgColor = isDisabled ? 'rgba(0, 0, 0, 0.12)' : currentColor.main;
                textColor = isDisabled ? 'rgba(0, 0, 0, 0.26)' : currentColor.contrastText;
            }
        } else {
            // Outlined
            bgColor = 'transparent';
            borderColor = isDisabled ? 'rgba(0, 0, 0, 0.12)' : (color === 'Default' ? 'rgba(0, 0, 0, 0.23)' : currentColor.main);
            textColor = isDisabled ? 'rgba(0, 0, 0, 0.26)' : (color === 'Default' ? 'rgba(0, 0, 0, 0.87)' : currentColor.main);
        }
    }

    // State effects (hover, focus)
    const getStateStyles = () => {
        if (isDisabled) return {};

        if (state === 'Hovered' && isClickable) {
            return {
                filter: 'brightness(0.92)',
            };
        }
        if (state === 'Focused') {
            return {
                boxShadow: `0 0 0 2px ${currentColor.main}40`,
            };
        }
        return {};
    };

    // Get the icon component
    const IconComponent = icon ? getIconByName(icon) : null;

    // Avatar placeholder
    const renderAvatar = () => {
        if (!showAvatar) return null;
        return (
            <div
                className="flex-shrink-0 rounded-full flex items-center justify-center"
                style={{
                    width: currentSize.avatarSize,
                    height: currentSize.avatarSize,
                    backgroundColor: darkMode ? '#424242' : '#bdbdbd',
                    marginRight: 6,
                    marginLeft: size === 'Small' ? -4 : -6,
                }}
            >
                <span
                    style={{
                        fontFamily: "'Roboto', sans-serif",
                        fontSize: currentSize.avatarSize * 0.5,
                        fontWeight: 500,
                        color: darkMode ? '#fff' : '#757575',
                    }}
                >
                    A
                </span>
            </div>
        );
    };

    return (
        <div
            data-node-id={darkMode ? "chip:dark" : "chip:light"}
            data-figma-props={JSON.stringify({ color, variant, size, state, disabled, deletable, clickable, showIcon, showAvatar })}
        >
            <div
                className={`inline-flex items-center rounded-full transition-all ${isClickable ? 'cursor-pointer' : ''} ${isDisabled ? 'cursor-not-allowed' : ''}`}
                style={{
                    height: currentSize.height,
                    padding: currentSize.padding,
                    backgroundColor: bgColor,
                    border: variant === 'Outlined' ? `1px solid ${borderColor}` : 'none',
                    ...getStateStyles(),
                }}
            >
                {/* Avatar */}
                {renderAvatar()}

                {/* Icon */}
                {showIcon && !showAvatar && IconComponent && (
                    <span
                        className="flex-shrink-0"
                        style={{
                            marginRight: 6,
                            marginLeft: size === 'Small' ? -4 : -6,
                        }}
                    >
                        <IconComponent color={textColor} size={currentSize.iconSize} />
                    </span>
                )}

                {/* Label */}
                <span
                    style={{
                        fontFamily: "'Roboto', sans-serif",
                        fontSize: `${currentSize.fontSize}px`,
                        fontWeight: 400,
                        color: textColor,
                        lineHeight: 1,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {label}
                </span>

                {/* Delete icon */}
                {deletable && !isDisabled && (
                    <button
                        className="flex-shrink-0 flex items-center justify-center hover:opacity-70 transition-opacity"
                        style={{
                            marginLeft: 6,
                            marginRight: size === 'Small' ? -4 : -6,
                            width: currentSize.iconSize,
                            height: currentSize.iconSize,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        <CloseIcon
                            color={textColor}
                            size={currentSize.iconSize - 4}
                        />
                    </button>
                )}
            </div>
        </div>
    );
}

export default FigmaChip;
