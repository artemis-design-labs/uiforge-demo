'use client';
import React from 'react';

export interface TabItem {
    label: string;
    value: string;
    disabled?: boolean;
}

export interface FigmaTabsProps {
    tabs?: TabItem[];
    activeTab?: string;
    darkMode?: boolean;
    // Variant properties
    variant?: 'Standard' | 'Fullwidth';
    color?: 'Primary' | 'Secondary';
    orientation?: 'Horizontal' | 'Vertical';
    indicatorPosition?: 'Bottom' | 'Top';
    // Boolean properties
    showIcon?: boolean;
    centered?: boolean;
}

/**
 * FigmaTabs - Tab navigation component
 * Supports LightMode and DarkMode variants
 *
 * Properties:
 * - variant: Standard, Fullwidth
 * - color: Primary, Secondary
 * - orientation: Horizontal, Vertical
 */
export function FigmaTabs({
    tabs = [
        { label: 'Text', value: 'text' },
        { label: 'Images & Video', value: 'images' },
        { label: 'Link', value: 'link' },
        { label: 'Poll', value: 'poll', disabled: true },
    ],
    activeTab = 'text',
    darkMode = false,
    variant = 'Standard',
    color = 'Primary',
    orientation = 'Horizontal',
    indicatorPosition = 'Bottom',
    showIcon = false,
    centered = false,
}: FigmaTabsProps) {
    const [active, setActive] = React.useState(activeTab);

    // Color configurations
    const colorPalette = {
        Primary: { active: '#1976d2', indicator: '#1976d2' },
        Secondary: { active: '#9c27b0', indicator: '#9c27b0' },
    };

    const currentColor = colorPalette[color] || colorPalette.Primary;

    // Text colors based on mode
    const textColors = {
        active: currentColor.active,
        inactive: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
        disabled: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.38)',
    };

    const isVertical = orientation === 'Vertical';

    return (
        <div
            data-node-id={darkMode ? "tabs:dark" : "tabs:light"}
            data-figma-props={JSON.stringify({ variant, color, orientation, indicatorPosition, showIcon, centered })}
            className={`
                flex
                ${isVertical ? 'flex-col' : 'flex-row'}
                ${centered && !isVertical ? 'justify-center' : ''}
                ${variant === 'Fullwidth' && !isVertical ? 'w-full' : ''}
            `}
        >
            {/* Tab Container */}
            <div
                className={`
                    flex
                    ${isVertical ? 'flex-col' : 'flex-row'}
                    ${variant === 'Fullwidth' && !isVertical ? 'w-full' : ''}
                    relative
                `}
                style={{
                    borderBottom: !isVertical && indicatorPosition === 'Bottom' ? `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}` : undefined,
                    borderTop: !isVertical && indicatorPosition === 'Top' ? `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}` : undefined,
                    borderRight: isVertical ? `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}` : undefined,
                }}
            >
                {tabs.map((tab) => {
                    const isActive = active === tab.value;
                    const isDisabled = tab.disabled;

                    return (
                        <button
                            key={tab.value}
                            onClick={() => !isDisabled && setActive(tab.value)}
                            disabled={isDisabled}
                            className={`
                                relative
                                px-[16px] py-[12px]
                                text-[14px] font-medium
                                tracking-[0.4px]
                                uppercase
                                transition-colors duration-200
                                ${variant === 'Fullwidth' && !isVertical ? 'flex-1' : ''}
                                ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                                hover:bg-opacity-10
                            `}
                            style={{
                                color: isDisabled ? textColors.disabled : isActive ? textColors.active : textColors.inactive,
                                fontFamily: "'Roboto', sans-serif",
                                backgroundColor: isActive && !isDisabled ? `${currentColor.active}14` : 'transparent',
                            }}
                        >
                            {tab.label}

                            {/* Active Indicator */}
                            {isActive && !isDisabled && (
                                <span
                                    className={`
                                        absolute
                                        ${isVertical ? 'right-0 top-0 bottom-0 w-[2px]' : ''}
                                        ${!isVertical && indicatorPosition === 'Bottom' ? 'bottom-0 left-0 right-0 h-[2px]' : ''}
                                        ${!isVertical && indicatorPosition === 'Top' ? 'top-0 left-0 right-0 h-[2px]' : ''}
                                    `}
                                    style={{ backgroundColor: currentColor.indicator }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default FigmaTabs;
