'use client';
import React from 'react';
import { getIconByName, HomeFilledIcon } from './FigmaIcons';

export interface FigmaNavItemProps {
    label?: string;
    icon?: string;
    href?: string;
    darkMode?: boolean;
    // Variant properties
    variant?: 'Default' | 'Compact';
    state?: 'Default' | 'Hovered' | 'Active' | 'Disabled';
    // Boolean properties
    showIcon?: boolean;
    showBadge?: boolean;
    badgeContent?: string;
    selected?: boolean;
    disabled?: boolean;
}

/**
 * FigmaNavItem - Navigation list item component
 * Supports LightMode and DarkMode variants
 *
 * Properties:
 * - variant: Default, Compact
 * - state: Default, Hovered, Active, Disabled
 * - showIcon: Display icon
 * - showBadge: Display badge
 */
export function FigmaNavItem({
    label = 'Home',
    icon = 'Home',
    href = '#',
    darkMode = false,
    variant = 'Default',
    state = 'Default',
    showIcon = true,
    showBadge = false,
    badgeContent = '',
    selected = false,
    disabled = false,
}: FigmaNavItemProps) {
    const isDisabled = disabled || state === 'Disabled';
    const isActive = selected || state === 'Active';
    const isHovered = state === 'Hovered';

    // Get icon component
    const IconComponent = getIconByName(icon) || HomeFilledIcon;

    // Size configurations
    const sizeConfig = {
        Default: { height: 'h-[48px]', padding: 'px-[16px]', iconSize: 'w-[24px] h-[24px]', fontSize: 'text-[14px]' },
        Compact: { height: 'h-[40px]', padding: 'px-[12px]', iconSize: 'w-[20px] h-[20px]', fontSize: 'text-[13px]' },
    };

    const currentSize = sizeConfig[variant] || sizeConfig.Default;

    // Colors based on state and mode
    const colors = {
        text: isDisabled
            ? (darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.38)')
            : isActive
                ? '#1976d2'
                : (darkMode ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)'),
        icon: isDisabled
            ? (darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.38)')
            : isActive
                ? '#1976d2'
                : (darkMode ? 'rgba(255,255,255,0.54)' : 'rgba(0,0,0,0.54)'),
        background: isActive
            ? (darkMode ? 'rgba(25,118,210,0.16)' : 'rgba(25,118,210,0.08)')
            : isHovered
                ? (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)')
                : 'transparent',
        badge: '#d32f2f',
    };

    return (
        <a
            href={!isDisabled ? href : undefined}
            data-node-id={darkMode ? "navitem:dark" : "navitem:light"}
            data-figma-props={JSON.stringify({ variant, state, showIcon, showBadge, selected })}
            className={`
                flex items-center gap-[12px]
                ${currentSize.height}
                ${currentSize.padding}
                rounded-[8px]
                ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                transition-all duration-200
            `}
            style={{ backgroundColor: colors.background }}
        >
            {/* Icon */}
            {showIcon && (
                <div className={`${currentSize.iconSize} flex items-center justify-center flex-shrink-0`}>
                    <IconComponent color={colors.icon} />
                </div>
            )}

            {/* Label */}
            <span
                className={`${currentSize.fontSize} font-medium flex-1`}
                style={{
                    color: colors.text,
                    fontFamily: "'Roboto', sans-serif",
                }}
            >
                {label}
            </span>

            {/* Badge */}
            {showBadge && badgeContent && (
                <span
                    className="px-[6px] py-[2px] text-[11px] font-medium rounded-full"
                    style={{
                        backgroundColor: colors.badge,
                        color: 'white',
                        fontFamily: "'Roboto', sans-serif",
                    }}
                >
                    {badgeContent}
                </span>
            )}
        </a>
    );
}

export default FigmaNavItem;
