'use client';

import React, { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    ColorTokensTab,
    SpacingTokensTab,
    ElevationTokensTab,
    TextTokensTab,
} from '@/components/tokens';
import { TokenImportModal } from './TokenImportModal';
import { TokenExportModal } from './TokenExportModal';
import { getValidationSummary } from '@/services/tokenValidator';

export function TokensSection() {
    const {
        designTokens,
        designTokensLoading,
        designTokensError,
        tokenCollection,
        tokenValidation,
    } = useAppSelector((state) => state.figma);

    const [showImportModal, setShowImportModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    const tokenCount = React.useMemo(() => {
        if (!designTokens) return 0;
        return (
            (designTokens.colors?.length || 0) +
            (designTokens.typography?.length || 0) +
            (designTokens.effects?.length || 0) +
            (Object.keys(designTokens.dimensions || {}).length > 0 ? 1 : 0)
        );
    }, [designTokens]);

    const collectionCount = tokenCollection?.tokens.length || 0;
    const validationSummary = tokenValidation ? getValidationSummary(tokenValidation) : null;

    return (
        <>
            <AccordionItem value="tokens" className="border-gray-700">
                <AccordionTrigger className="text-gray-300 hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                        <TokensIcon className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium">Design Tokens</span>
                        {(tokenCount > 0 || collectionCount > 0) && (
                            <span className="text-xs text-purple-400 bg-purple-900/50 px-2 py-0.5 rounded ml-2">
                                {tokenCount + collectionCount}
                            </span>
                        )}
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    {/* Import/Export Actions */}
                    <div className="flex items-center gap-2 mb-3">
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                        >
                            <ImportIcon className="w-3.5 h-3.5" />
                            Import
                        </button>
                        <button
                            onClick={() => setShowExportModal(true)}
                            disabled={collectionCount === 0}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
                        >
                            <ExportIcon className="w-3.5 h-3.5" />
                            Export
                        </button>
                    </div>

                    {/* Token Collection Info */}
                    {tokenCollection && (
                        <div className="mb-3 p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-purple-300 text-xs font-medium">
                                        {tokenCollection.name}
                                    </span>
                                    <span className="text-gray-500 text-xs ml-2">
                                        ({collectionCount} tokens)
                                    </span>
                                </div>
                                {validationSummary && (
                                    <span className={`text-xs ${
                                        tokenValidation?.errors.length ? 'text-red-400' :
                                        tokenValidation?.warnings.length ? 'text-yellow-400' :
                                        'text-green-400'
                                    }`}>
                                        {validationSummary}
                                    </span>
                                )}
                            </div>
                            {tokenCollection.metadata?.source && (
                                <span className="text-gray-500 text-[10px]">
                                    Source: {tokenCollection.metadata.source}
                                </span>
                            )}
                        </div>
                    )}

                    {designTokensLoading ? (
                        <LoadingState />
                    ) : designTokensError ? (
                        <ErrorState error={designTokensError} />
                    ) : designTokens ? (
                        <Tabs defaultValue="color" className="w-full">
                            <TabsList className="grid w-full grid-cols-4 bg-gray-800 rounded-lg p-1 mb-3">
                                <TabsTrigger value="color">Color</TabsTrigger>
                                <TabsTrigger value="spacing">Spacing</TabsTrigger>
                                <TabsTrigger value="elevation">Elevation</TabsTrigger>
                                <TabsTrigger value="text">Text</TabsTrigger>
                            </TabsList>
                            <TabsContent value="color">
                                <ColorTokensTab colors={designTokens.colors || []} />
                            </TabsContent>
                            <TabsContent value="spacing">
                                <SpacingTokensTab dimensions={designTokens.dimensions || {}} />
                            </TabsContent>
                            <TabsContent value="elevation">
                                <ElevationTokensTab effects={designTokens.effects || []} />
                            </TabsContent>
                            <TabsContent value="text">
                                <TextTokensTab typography={designTokens.typography || []} />
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <EmptyState onImport={() => setShowImportModal(true)} />
                    )}
                </AccordionContent>
            </AccordionItem>

            {/* Modals */}
            <TokenImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
            />
            <TokenExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
            />
        </>
    );
}

function LoadingState() {
    return (
        <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-400 border-t-transparent" />
            <span className="ml-2 text-gray-400 text-sm">Loading tokens...</span>
        </div>
    );
}

function ErrorState({ error }: { error: string }) {
    return (
        <div className="py-4 px-3 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
        </div>
    );
}

function EmptyState({ onImport }: { onImport?: () => void }) {
    return (
        <div className="text-gray-500 text-sm py-6 text-center">
            <TokensIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Select a component to view design tokens</p>
            <p className="text-xs mt-1">
                or{' '}
                <button
                    onClick={onImport}
                    className="text-purple-400 hover:text-purple-300 underline"
                >
                    import a token file
                </button>
            </p>
        </div>
    );
}

function TokensIcon({ className }: { className?: string }) {
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
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    );
}

function ImportIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    );
}

function ExportIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}
