'use client';
import React from 'react';

// Chevron separator icon
const ChevronSeparator = ({ color = 'currentColor' }: { color?: string }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 6L8.59 7.41L13.17 12L8.59 16.59L10 18L16 12L10 6Z" fill={color} />
    </svg>
);

// Home icon
const HomeIcon = ({ color = 'currentColor' }: { color?: string }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill={color} />
    </svg>
);

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

export interface FigmaBreadcrumbProps {
    items?: BreadcrumbItem[];
    showHomeIcon?: boolean;
    darkMode?: boolean;
}

/**
 * FigmaBreadcrumb - Generated from Figma design
 * Supports both LightMode and DarkMode variants
 */
export function FigmaBreadcrumb({
    items = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: 'Category', href: '/category' },
        { label: 'Current Page' },
    ],
    showHomeIcon = true,
    darkMode = false,
}: FigmaBreadcrumbProps) {
    // Colors based on mode
    const bgColor = darkMode ? '#1e1e1e' : 'white';
    const textPrimary = darkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
    const textSecondary = darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
    const linkColor = darkMode ? '#90caf9' : '#1976d2';
    const separatorColor = darkMode ? 'rgba(255, 255, 255, 0.38)' : 'rgba(0, 0, 0, 0.38)';

    return (
        <div
            data-node-id={darkMode ? "breadcrumb-dark" : "breadcrumb-light"}
            data-mode={darkMode ? "dark" : "light"}
        >
            <nav
                className="flex items-center py-2 px-4"
                style={{
                    backgroundColor: bgColor,
                    borderRadius: '4px',
                }}
                aria-label="Breadcrumb"
            >
                <ol className="flex items-center gap-1">
                    {items.map((item, index) => {
                        const isLast = index === items.length - 1;
                        const isFirst = index === 0;

                        return (
                            <li key={index} className="flex items-center">
                                {/* Separator (except for first item) */}
                                {!isFirst && (
                                    <span className="mx-2">
                                        <ChevronSeparator color={separatorColor} />
                                    </span>
                                )}

                                {/* Home icon for first item */}
                                {isFirst && showHomeIcon && (
                                    <span className="mr-1 flex items-center">
                                        <HomeIcon color={isLast ? textPrimary : linkColor} />
                                    </span>
                                )}

                                {/* Breadcrumb text/link */}
                                {isLast ? (
                                    <span
                                        className="text-sm"
                                        style={{
                                            fontFamily: "'Roboto', sans-serif",
                                            fontWeight: 400,
                                            color: textPrimary,
                                        }}
                                        aria-current="page"
                                    >
                                        {item.label}
                                    </span>
                                ) : (
                                    <span
                                        className="text-sm cursor-pointer hover:underline"
                                        style={{
                                            fontFamily: "'Roboto', sans-serif",
                                            fontWeight: 400,
                                            color: linkColor,
                                        }}
                                    >
                                        {item.label}
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </div>
    );
}

export default FigmaBreadcrumb;
