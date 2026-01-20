'use client';

import React, { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PackageGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PackageGeneratorModal({ isOpen, onClose }: PackageGeneratorModalProps) {
    const { fileComponentDefinitions, currentFileKey } = useAppSelector((state) => state.figma);

    const [packageName, setPackageName] = useState('@myorg/design-system');
    const [version, setVersion] = useState('1.0.0');
    const [description, setDescription] = useState('React component library generated from Figma');
    const [author, setAuthor] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const componentCount = Object.keys(fileComponentDefinitions).length;

    const handleGenerate = async () => {
        if (componentCount === 0) {
            setError('No components found. Load a Figma file first.');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            // Convert fileComponentDefinitions to the format expected by the API
            const components: Record<string, any> = {};
            for (const [name, def] of Object.entries(fileComponentDefinitions)) {
                components[name] = {
                    name,
                    nodeId: def.nodeId,
                    properties: def.properties,
                };
            }

            const response = await fetch('/api/package/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    components,
                    config: {
                        packageName,
                        version,
                        description,
                        author,
                        license: 'MIT',
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate package');
            }

            // Download the zip file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${packageName.replace('@', '').replace('/', '-')}-${version}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            onClose();
        } catch (err: any) {
            console.error('Package generation error:', err);
            setError(err.message || 'Failed to generate package');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Generate npm Package</h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Export {componentCount} components as an installable package
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-4">
                    {/* Package Name */}
                    <div className="space-y-2">
                        <Label htmlFor="packageName" className="text-gray-300">
                            Package Name
                        </Label>
                        <Input
                            id="packageName"
                            value={packageName}
                            onChange={(e) => setPackageName(e.target.value)}
                            placeholder="@myorg/design-system"
                            className="bg-gray-800 border-gray-600 text-white"
                        />
                        <p className="text-xs text-gray-500">
                            Use @scope/name format for scoped packages
                        </p>
                    </div>

                    {/* Version */}
                    <div className="space-y-2">
                        <Label htmlFor="version" className="text-gray-300">
                            Version
                        </Label>
                        <Input
                            id="version"
                            value={version}
                            onChange={(e) => setVersion(e.target.value)}
                            placeholder="1.0.0"
                            className="bg-gray-800 border-gray-600 text-white"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-gray-300">
                            Description
                        </Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="My design system components"
                            className="bg-gray-800 border-gray-600 text-white"
                        />
                    </div>

                    {/* Author */}
                    <div className="space-y-2">
                        <Label htmlFor="author" className="text-gray-300">
                            Author
                        </Label>
                        <Input
                            id="author"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Your Name <you@example.com>"
                            className="bg-gray-800 border-gray-600 text-white"
                        />
                    </div>

                    {/* Components Preview */}
                    <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">
                            Components to Export
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(fileComponentDefinitions).slice(0, 10).map((name) => (
                                <span
                                    key={name}
                                    className="px-2 py-1 text-xs bg-blue-900/50 text-blue-300 rounded"
                                >
                                    {name.split('/')[0]}
                                </span>
                            ))}
                            {componentCount > 10 && (
                                <span className="px-2 py-1 text-xs bg-gray-700 text-gray-400 rounded">
                                    +{componentCount - 10} more
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-gray-800/30">
                    <p className="text-xs text-gray-500">
                        Package includes: components, types, theme, README
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || componentCount === 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isGenerating ? (
                                <>
                                    <SpinnerIcon className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <PackageIcon className="w-4 h-4 mr-2" />
                                    Download Package
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Icons
function CloseIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
        </svg>
    );
}

function PackageIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
    );
}

function SpinnerIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
    );
}

export default PackageGeneratorModal;
