'use client';

import React from 'react';
import type { ColorToken } from '@/store/figmaSlice';
import { getColorToken } from '@/services/tokenMapping';

interface ColorTokensTabProps {
    colors: ColorToken[];
}

export function ColorTokensTab({ colors }: ColorTokensTabProps) {
    const [copiedValue, setCopiedValue] = React.useState<string | null>(null);

    const handleCopy = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopiedValue(value);
            setTimeout(() => setCopiedValue(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (colors.length === 0) {
        return (
            <div className="text-gray-500 text-sm py-4 text-center">
                No colors found in this component
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {colors.map((color, index) => {
                const tokenMatch = getColorToken(color.hex);
                const displayName = tokenMatch?.name;
                const category = tokenMatch?.category;

                return (
                    <div
                        key={`${color.hex}-${index}`}
                        className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                    >
                        {/* Color swatch */}
                        <div
                            className="w-8 h-8 rounded-md border border-gray-600 flex-shrink-0"
                            style={{ backgroundColor: color.hex }}
                        />

                        {/* Color info */}
                        <div className="flex-1 min-w-0">
                            {/* Token name (if matched) or hex */}
                            <div className="flex items-center gap-2">
                                {displayName ? (
                                    <>
                                        <span className="text-purple-400 text-sm font-medium">
                                            {displayName}
                                        </span>
                                        <button
                                            onClick={() => handleCopy(displayName)}
                                            className="text-gray-400 hover:text-white transition-colors"
                                            title="Copy token name"
                                        >
                                            {copiedValue === displayName ? (
                                                <CheckIcon className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <CopyIcon className="w-4 h-4" />
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-white text-sm font-mono">
                                            {color.hex}
                                        </span>
                                        <button
                                            onClick={() => handleCopy(color.hex)}
                                            className="text-gray-400 hover:text-white transition-colors"
                                            title="Copy hex value"
                                        >
                                            {copiedValue === color.hex ? (
                                                <CheckIcon className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <CopyIcon className="w-4 h-4" />
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Secondary info: hex value (if token matched) or usage */}
                            {displayName ? (
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-gray-400 font-mono">{color.hex}</span>
                                    {category && (
                                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px]">
                                            {category}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                color.usedIn && color.usedIn.length > 0 && (
                                    <div className="text-gray-500 text-xs truncate">
                                        {color.usedIn.slice(0, 2).join(', ')}
                                        {color.usedIn.length > 2 && ` +${color.usedIn.length - 2} more`}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function CopyIcon({ className }: { className?: string }) {
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
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
    );
}

function CheckIcon({ className }: { className?: string }) {
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
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}
