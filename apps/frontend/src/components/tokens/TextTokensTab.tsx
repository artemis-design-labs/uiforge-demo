'use client';

import React from 'react';
import type { TypographyToken } from '@/store/figmaSlice';
import { getTypographyToken, getFontSizeToken } from '@/services/tokenMapping';

interface TextTokensTabProps {
    typography: TypographyToken[];
}

export function TextTokensTab({ typography }: TextTokensTabProps) {
    if (typography.length === 0) {
        return (
            <div className="text-gray-500 text-sm py-4 text-center">
                No text styles found in this component
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {typography.map((item, index) => {
                const fontToken = getTypographyToken(item.style.fontFamily);
                const sizeToken = getFontSizeToken(item.style.fontSize);

                return (
                    <div
                        key={index}
                        className="p-3 rounded-lg bg-gray-800/50 space-y-2"
                    >
                        {/* Text preview */}
                        {item.style.text && (
                            <div
                                className="text-white truncate"
                                style={{
                                    fontFamily: item.style.fontFamily,
                                    fontSize: Math.min(item.style.fontSize, 24),
                                    fontWeight: item.style.fontWeight,
                                }}
                            >
                                {item.style.text}
                            </div>
                        )}

                        {/* Node name */}
                        <div className="text-gray-500 text-xs">
                            {item.node}
                        </div>

                        {/* Typography details with token names */}
                        <div className="flex flex-wrap gap-2">
                            {/* Font Family */}
                            {fontToken ? (
                                <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-300">
                                    {fontToken.name}
                                </span>
                            ) : (
                                <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                                    {item.style.fontFamily}
                                </span>
                            )}

                            {/* Font Size */}
                            {sizeToken ? (
                                <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-300">
                                    {sizeToken.name}
                                </span>
                            ) : (
                                <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                                    {item.style.fontSize}px
                                </span>
                            )}

                            {/* Font Weight */}
                            <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                                {getFontWeightLabel(item.style.fontWeight)}
                            </span>
                        </div>

                        {/* Show raw values if tokens matched */}
                        {(fontToken || sizeToken) && (
                            <div className="text-gray-500 text-xs">
                                {fontToken && <span>{item.style.fontFamily}</span>}
                                {fontToken && sizeToken && <span> · </span>}
                                {sizeToken && <span>{item.style.fontSize}px</span>}
                            </div>
                        )}

                        {/* Additional details */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {item.style.lineHeight !== undefined && (
                                <div className="flex justify-between text-gray-400">
                                    <span>Line Height</span>
                                    <span className="text-gray-300">
                                        {Math.round(item.style.lineHeight)}px
                                    </span>
                                </div>
                            )}
                            {item.style.letterSpacing !== undefined && item.style.letterSpacing !== 0 && (
                                <div className="flex justify-between text-gray-400">
                                    <span>Letter Spacing</span>
                                    <span className="text-gray-300">
                                        {item.style.letterSpacing.toFixed(2)}px
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function getFontWeightLabel(weight: number): string {
    const weights: Record<number, string> = {
        100: 'Thin',
        200: 'Extra Light',
        300: 'Light',
        400: 'Regular',
        500: 'Medium',
        600: 'Semi Bold',
        700: 'Bold',
        800: 'Extra Bold',
        900: 'Black',
    };
    return weights[weight] || `${weight}`;
}
