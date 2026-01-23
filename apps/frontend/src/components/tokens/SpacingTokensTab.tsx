'use client';

import React from 'react';
import type { DimensionsToken } from '@/store/figmaSlice';
import { getSpacingToken, getBorderRadiusToken } from '@/services/tokenMapping';

interface SpacingEntry {
    label: string;
    value: string;
    tokenName?: string;
    category?: string;
    icon: React.ReactNode;
}

interface SpacingTokensTabProps {
    dimensions: DimensionsToken;
}

export function SpacingTokensTab({ dimensions }: SpacingTokensTabProps) {
    const entries = React.useMemo(() => {
        const items: SpacingEntry[] = [];

        if (dimensions.width !== undefined) {
            const token = getSpacingToken(dimensions.width);
            items.push({
                label: 'Width',
                value: `${dimensions.width}px`,
                tokenName: token?.name,
                category: token?.category,
                icon: <WidthIcon className="w-4 h-4" />,
            });
        }

        if (dimensions.height !== undefined) {
            const token = getSpacingToken(dimensions.height);
            items.push({
                label: 'Height',
                value: `${dimensions.height}px`,
                tokenName: token?.name,
                category: token?.category,
                icon: <HeightIcon className="w-4 h-4" />,
            });
        }

        if (dimensions.borderRadius !== undefined) {
            const radiusValue = Array.isArray(dimensions.borderRadius)
                ? dimensions.borderRadius.map(r => `${r}px`).join(' ')
                : `${dimensions.borderRadius}px`;

            // Try to match token for single radius values
            const token = !Array.isArray(dimensions.borderRadius)
                ? getBorderRadiusToken(dimensions.borderRadius)
                : null;

            items.push({
                label: 'Border Radius',
                value: radiusValue,
                tokenName: token?.name,
                category: token?.category,
                icon: <RadiusIcon className="w-4 h-4" />,
            });
        }

        if (dimensions.strokeWeight !== undefined) {
            const token = getSpacingToken(dimensions.strokeWeight);
            items.push({
                label: 'Stroke',
                value: `${dimensions.strokeWeight}px`,
                tokenName: token?.name,
                category: token?.category,
                icon: <StrokeIcon className="w-4 h-4" />,
            });
        }

        return items;
    }, [dimensions]);

    if (entries.length === 0) {
        return (
            <div className="text-gray-500 text-sm py-4 text-center">
                No spacing data found
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {entries.map((entry) => (
                <div
                    key={entry.label}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50"
                >
                    <div className="flex items-center gap-2 text-gray-400">
                        {entry.icon}
                        <span className="text-sm">{entry.label}</span>
                    </div>
                    <div className="text-right">
                        {entry.tokenName ? (
                            <>
                                <span className="text-purple-400 text-sm font-medium">
                                    {entry.tokenName}
                                </span>
                                <div className="flex items-center gap-1.5 justify-end">
                                    <span className="text-gray-500 text-xs font-mono">
                                        {entry.value}
                                    </span>
                                    {entry.category && (
                                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px]">
                                            {entry.category}
                                        </span>
                                    )}
                                </div>
                            </>
                        ) : (
                            <span className="text-white text-sm font-mono">
                                {entry.value}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function WidthIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 12H3" />
            <path d="m15 6 6 6-6 6" />
            <path d="m9 18-6-6 6-6" />
        </svg>
    );
}

function HeightIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 3v18" />
            <path d="m18 9-6-6-6 6" />
            <path d="m6 15 6 6 6-6" />
        </svg>
    );
}

function RadiusIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
        </svg>
    );
}

function StrokeIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 12h20" />
        </svg>
    );
}
