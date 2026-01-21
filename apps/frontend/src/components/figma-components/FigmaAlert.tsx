'use client';
import React from 'react';
import { getIconByName, InfoOutlinedIcon, WarningOutlinedIcon, ErrorOutlinedIcon, SuccessOutlinedIcon, CloseIcon } from './FigmaIcons';

export interface FigmaAlertProps {
    // TEXT properties
    title?: string;
    description?: string;
    // VARIANT properties
    severity?: 'Error' | 'Warning' | 'Info' | 'Success';
    variant?: 'Filled' | 'Outlined' | 'Standard';
    // BOOLEAN properties
    showIcon?: boolean;
    showClose?: boolean;
    showTitle?: boolean;
    // INSTANCE_SWAP properties
    icon?: string;
    // Mode
    darkMode?: boolean;
}

/**
 * FigmaAlert - Alert component from Figma design
 * Supports severity levels, variants, and dark/light modes
 */
export function FigmaAlert({
    title = 'Alert Title',
    description = 'This is an alert description that provides more details.',
    severity = 'Info',
    variant = 'Standard',
    showIcon = true,
    showClose = true,
    showTitle = true,
    icon,
    darkMode = false,
}: FigmaAlertProps) {
    // Severity color configurations
    const severityColors: Record<string, { main: string; light: string; dark: string; contrastText: string }> = {
        Error: { main: '#d32f2f', light: '#ef5350', dark: '#c62828', contrastText: '#fff' },
        Warning: { main: '#ed6c02', light: '#ff9800', dark: '#e65100', contrastText: '#fff' },
        Info: { main: '#0288d1', light: '#03a9f4', dark: '#01579b', contrastText: '#fff' },
        Success: { main: '#2e7d32', light: '#4caf50', dark: '#1b5e20', contrastText: '#fff' },
    };

    const colors = severityColors[severity] || severityColors.Info;

    // Get the appropriate icon
    const getAlertIcon = () => {
        if (icon) {
            const IconComponent = getIconByName(icon);
            if (IconComponent) return IconComponent;
        }
        switch (severity) {
            case 'Error': return ErrorOutlinedIcon;
            case 'Warning': return WarningOutlinedIcon;
            case 'Success': return SuccessOutlinedIcon;
            default: return InfoOutlinedIcon;
        }
    };

    const IconComponent = getAlertIcon();

    // Calculate styles based on variant
    let bgColor: string;
    let borderColor: string | undefined;
    let textColor: string;
    let iconColor: string;

    if (darkMode) {
        switch (variant) {
            case 'Filled':
                bgColor = colors.dark;
                textColor = colors.contrastText;
                iconColor = colors.contrastText;
                break;
            case 'Outlined':
                bgColor = 'transparent';
                borderColor = colors.light;
                textColor = colors.light;
                iconColor = colors.light;
                break;
            default: // Standard
                bgColor = `${colors.dark}20`;
                textColor = colors.light;
                iconColor = colors.light;
        }
    } else {
        switch (variant) {
            case 'Filled':
                bgColor = colors.main;
                textColor = colors.contrastText;
                iconColor = colors.contrastText;
                break;
            case 'Outlined':
                bgColor = 'transparent';
                borderColor = colors.main;
                textColor = colors.main;
                iconColor = colors.main;
                break;
            default: // Standard
                bgColor = `${colors.light}20`;
                textColor = colors.dark;
                iconColor = colors.main;
        }
    }

    return (
        <div
            data-node-id={darkMode ? "alert:dark" : "alert:light"}
            data-figma-props={JSON.stringify({ severity, variant, showIcon, showClose, showTitle })}
        >
            <div
                className={`flex items-start p-4 rounded ${variant === 'Outlined' ? 'border' : ''}`}
                style={{
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                    minWidth: '300px',
                    maxWidth: '600px',
                }}
            >
                {/* Icon */}
                {showIcon && (
                    <div className="flex-shrink-0 mr-3">
                        <IconComponent color={iconColor} size={24} />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1">
                    {showTitle && title && (
                        <p
                            className="font-medium mb-1"
                            style={{
                                fontFamily: "'Roboto', sans-serif",
                                fontSize: '16px',
                                lineHeight: 1.5,
                                color: textColor,
                            }}
                        >
                            {title}
                        </p>
                    )}
                    <p
                        style={{
                            fontFamily: "'Roboto', sans-serif",
                            fontSize: '14px',
                            lineHeight: 1.43,
                            color: textColor,
                            opacity: showTitle ? 0.9 : 1,
                        }}
                    >
                        {description}
                    </p>
                </div>

                {/* Close Button */}
                {showClose && (
                    <button
                        className="flex-shrink-0 ml-3 p-1 hover:opacity-70 transition-opacity"
                        style={{ color: textColor }}
                    >
                        <CloseIcon color={textColor} size={20} />
                    </button>
                )}
            </div>
        </div>
    );
}

export default FigmaAlert;
