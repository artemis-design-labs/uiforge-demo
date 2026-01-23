'use client';

import React from 'react';
import type { EffectToken } from '@/store/figmaSlice';
import { getElevationToken } from '@/services/tokenMapping';

interface ElevationTokensTabProps {
    effects: EffectToken[];
}

export function ElevationTokensTab({ effects }: ElevationTokensTabProps) {
    const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
    const [copiedTokenName, setCopiedTokenName] = React.useState<string | null>(null);

    const generateCssBoxShadow = (effect: EffectToken): string | null => {
        if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
            const inset = effect.type === 'INNER_SHADOW' ? 'inset ' : '';
            const x = effect.offset?.x ?? 0;
            const y = effect.offset?.y ?? 0;
            const blur = effect.radius ?? 0;
            const spread = effect.spread ?? 0;
            const color = effect.rgba || effect.color || 'rgba(0, 0, 0, 0.25)';
            return `${inset}${x}px ${y}px ${blur}px ${spread}px ${color}`;
        }
        return null;
    };

    // Generate a shadow pattern for matching (without color)
    const generateShadowPattern = (effect: EffectToken): string | null => {
        if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
            const x = effect.offset?.x ?? 0;
            const y = effect.offset?.y ?? 0;
            const blur = effect.radius ?? 0;
            const spread = effect.spread ?? 0;
            return `${x} ${y}px ${blur}px ${spread}px`;
        }
        return null;
    };

    const handleCopy = async (css: string, index: number) => {
        try {
            await navigator.clipboard.writeText(css);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleCopyTokenName = async (name: string) => {
        try {
            await navigator.clipboard.writeText(name);
            setCopiedTokenName(name);
            setTimeout(() => setCopiedTokenName(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (effects.length === 0) {
        return (
            <div className="text-gray-500 text-sm py-4 text-center">
                No effects found in this component
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {effects.map((effect, index) => {
                const cssValue = generateCssBoxShadow(effect);
                const shadowPattern = generateShadowPattern(effect);
                const effectLabel = effect.type.replace(/_/g, ' ').toLowerCase();
                const token = shadowPattern ? getElevationToken(shadowPattern) : null;

                return (
                    <div
                        key={index}
                        className="p-3 rounded-lg bg-gray-800/50 space-y-2"
                    >
                        {/* Effect preview */}
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-md bg-gray-600"
                                style={{
                                    boxShadow: cssValue || undefined,
                                }}
                            />
                            <div className="flex-1">
                                {/* Show token name if matched */}
                                {token ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-purple-400 text-sm font-medium">
                                            {token.name}
                                        </span>
                                        <button
                                            onClick={() => handleCopyTokenName(token.name)}
                                            className="text-gray-400 hover:text-white transition-colors"
                                            title="Copy token name"
                                        >
                                            {copiedTokenName === token.name ? (
                                                <CheckIcon className="w-3 h-3 text-green-400" />
                                            ) : (
                                                <CopyIcon className="w-3 h-3" />
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-white text-sm capitalize">
                                        {effectLabel}
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    {token && (
                                        <span className="text-gray-500 text-xs capitalize">
                                            {effectLabel}
                                        </span>
                                    )}
                                    {effect.color && (
                                        <span className="text-gray-500 text-xs">
                                            {effect.color}
                                        </span>
                                    )}
                                    {token?.category && (
                                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px]">
                                            {token.category}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Effect details */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {effect.offset && (
                                <div className="flex justify-between text-gray-400">
                                    <span>Offset</span>
                                    <span className="text-gray-300">
                                        {effect.offset.x}, {effect.offset.y}
                                    </span>
                                </div>
                            )}
                            {effect.radius !== undefined && (
                                <div className="flex justify-between text-gray-400">
                                    <span>Blur</span>
                                    <span className="text-gray-300">{effect.radius}px</span>
                                </div>
                            )}
                            {effect.spread !== undefined && (
                                <div className="flex justify-between text-gray-400">
                                    <span>Spread</span>
                                    <span className="text-gray-300">{effect.spread}px</span>
                                </div>
                            )}
                        </div>

                        {/* Copy CSS button */}
                        {cssValue && (
                            <button
                                onClick={() => handleCopy(cssValue, index)}
                                className="w-full mt-2 py-1.5 px-3 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors flex items-center justify-center gap-2"
                            >
                                {copiedIndex === index ? (
                                    <>
                                        <CheckIcon className="w-3 h-3 text-green-400" />
                                        <span>Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <CopyIcon className="w-3 h-3" />
                                        <span>Copy CSS</span>
                                    </>
                                )}
                            </button>
                        )}
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
