'use client';
import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { figmaService } from '@/services/figma';
import { ComponentRenderer, isComponentSupported } from '@/components/figma-components';

export default function DesignPage() {
    const { selectedComponent, selectedComponentName, selectedComponentType, currentFileKey } = useAppSelector((state) => state.figma);

    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useFallback, setUseFallback] = useState(false);

    // Fetch component image when selection changes
    useEffect(() => {
        if (!selectedComponent || !currentFileKey) {
            setImageUrl(null);
            setError(null);
            setUseFallback(false);
            return;
        }

        const fetchImage = async () => {
            setLoading(true);
            setError(null);
            setUseFallback(false);

            try {
                console.log('🖼️ Fetching image for:', selectedComponent, 'in file:', currentFileKey);
                const response = await figmaService.getComponentImage(currentFileKey, selectedComponent, {
                    scale: 2,
                    format: 'png'
                });
                setImageUrl(response.imageUrl);
            } catch (err: any) {
                console.error('Failed to fetch component image:', err);

                // Check if we have a React fallback for this component
                if (selectedComponentName && isComponentSupported(selectedComponentName)) {
                    console.log('Using React component fallback for:', selectedComponentName);
                    setUseFallback(true);
                    setError(null);
                } else if (err.response?.status === 401) {
                    setError('Session expired. Please log in again.');
                } else if (err.response?.status === 403) {
                    setError('Access denied. You may not have permission to view this file.');
                } else if (err.response?.status === 404) {
                    // Backend endpoint not available, use fallback if possible
                    if (selectedComponentName && isComponentSupported(selectedComponentName)) {
                        setUseFallback(true);
                    } else {
                        setError('Component preview unavailable. The image endpoint may not be deployed.');
                    }
                } else {
                    setError(err.message || 'Failed to load component image');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchImage();
    }, [selectedComponent, currentFileKey, selectedComponentName]);

    const renderContent = () => {
        // No component selected
        if (!selectedComponent || !selectedComponentName) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="text-muted-foreground mb-4">
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                        <p className="text-lg font-medium mb-2">No Component Selected</p>
                        <p className="text-sm opacity-75">
                            Load a Figma file and select a component from the sidebar to preview it here.
                        </p>
                    </div>
                </div>
            );
        }

        // Loading state
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground">Loading component...</p>
                </div>
            );
        }

        // Use React component fallback
        if (useFallback && selectedComponentName) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-8">
                    <div className="mb-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        React Component Preview
                    </div>
                    <ComponentRenderer componentName={selectedComponentName} />
                </div>
            );
        }

        // Error state
        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="text-destructive mb-4">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-lg font-medium mb-2">Failed to Load Component</p>
                        <p className="text-sm opacity-75">{error}</p>
                    </div>

                    {/* Show component info even on error */}
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                        <p className="text-foreground font-medium">{selectedComponentName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Type: {selectedComponentType} | Node ID: {selectedComponent}
                        </p>
                    </div>

                    {error.includes('log in') && (
                        <a
                            href="/login"
                            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            Go to Login
                        </a>
                    )}
                </div>
            );
        }

        // Image loaded successfully
        if (imageUrl) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-8">
                    {/* Component Image */}
                    <div className="bg-white rounded-lg shadow-lg p-4 max-w-full overflow-auto">
                        <img
                            src={imageUrl}
                            alt={selectedComponentName || 'Component'}
                            className="max-w-full h-auto"
                            style={{ maxHeight: '60vh' }}
                        />
                    </div>

                    {/* Component Info */}
                    <div className="mt-6 text-center">
                        <p className="text-foreground font-medium">{selectedComponentName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Type: {selectedComponentType} | Node ID: {selectedComponent}
                        </p>
                    </div>
                </div>
            );
        }

        // Fallback - show component info
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="p-6 bg-muted/30 rounded-lg">
                    <p className="text-foreground font-medium text-lg">{selectedComponentName}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Type: {selectedComponentType}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Node ID: {selectedComponent}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full w-full bg-[#1a1a1a] flex items-center justify-center">
            {/* Main rendering area with subtle grid background */}
            <div
                className="w-full h-full"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px',
                }}
            >
                {renderContent()}
            </div>
        </div>
    );
}
