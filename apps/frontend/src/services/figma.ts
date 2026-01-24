import axios from '@/lib/axios';

interface ExtendedError extends Error {
    isDocumentSizeError?: boolean;
    friendlyMessage?: string;
    response?: {
        status?: number;
        data?: any;
    };
}

export const figmaService = {
    // Load file structure from URL
    // Uses depth parameter to limit tree depth for large files (default: 3)
    loadFile: async (figmaUrl: string, options?: { partial?: boolean; depth?: number }) => {
        const fileKey = extractFileKey(figmaUrl);
        if (!fileKey) throw new Error('Invalid Figma URL');

        const params: Record<string, any> = {};
        if (options?.partial) params.partial = true;
        // Default depth of 3 is sufficient for showing pages and components
        params.depth = options?.depth ?? 3;

        const response = await axios.get(`/figma/file/${fileKey}`, { params });
        return response.data;
    },

    // Load file with fallback for large files
    loadFileWithFallback: async (figmaUrl: string) => {
        try {
            // First attempt: Load full file
            return await figmaService.loadFile(figmaUrl);
        } catch (error) {
            const axiosError = error as ExtendedError;
            if (axiosError.isDocumentSizeError) {
                // Fallback: Try loading partial file structure
                console.log('File too large, attempting partial load...');
                try {
                    const partialData = await figmaService.loadFile(figmaUrl, { partial: true });
                    return {
                        ...partialData,
                        isPartialLoad: true,
                        message: 'Large file loaded partially. Some data may be limited.'
                    };
                } catch {
                    // If fallback also fails, throw original error
                    throw error;
                }
            }
            throw error;
        }
    },

    // Load instance data
    loadInstance: async (fileKey: string, nodeId: string) => {
        console.log('🌐 FigmaService: Making API call to load instance', { fileKey, nodeId });
        const url = `/figma/instance/${fileKey}/${nodeId}`;
        console.log('🔗 API URL:', url);

        try {
            const response = await axios.get(url);
            console.log('✅ FigmaService: API response received', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ FigmaService: API call failed', error);
            throw error;
        }
    },

    // Get rendered image of a component
    // Uses Next.js API route that directly calls Figma API (bypasses backend)
    getComponentImage: async (fileKey: string, nodeId: string, options?: { scale?: number; format?: string }) => {
        const { scale = 2, format = 'png' } = options || {};
        console.log('🖼️ FigmaService: Fetching component image', { fileKey, nodeId, scale, format });

        try {
            // Use Next.js API route (direct Figma API call)
            const response = await fetch(`/api/figma/image/${fileKey}/${nodeId}?scale=${scale}&format=${format}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                const error = new Error(errorData.error || 'Failed to fetch image') as ExtendedError;
                error.response = { status: response.status, data: errorData };
                throw error;
            }

            const data = await response.json();
            console.log('✅ FigmaService: Image URL received', data);
            return data;
        } catch (error) {
            console.error('❌ FigmaService: Failed to fetch image', error);
            throw error;
        }
    },

    // Get all component property definitions from a file
    // This should be called once when a file is loaded
    getFileComponentProperties: async (fileKey: string) => {
        console.log('📋 FigmaService: Fetching all component properties for file', fileKey);

        try {
            const response = await fetch(`/api/figma/file-components/${fileKey}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

                // Log detailed error info for debugging
                console.error('❌ FigmaService: Failed to fetch file component properties', {
                    status: response.status,
                    error: errorData.error,
                    suggestion: errorData.suggestion,
                    details: errorData.details,
                    debugInfo: errorData.debugInfo
                });

                // Show user-friendly message in console
                if (errorData.suggestion) {
                    console.warn('💡 Suggestion:', errorData.suggestion);
                }

                const error = new Error(errorData.error || 'Failed to fetch file data') as ExtendedError;
                error.response = { status: response.status, data: errorData };
                throw error;
            }

            const data = await response.json();
            console.log('✅ FigmaService: File component properties received', {
                fileKey,
                componentCount: data.componentCount,
                iconCount: data.iconCount
            });
            return data;
        } catch (error) {
            console.error('❌ FigmaService: Failed to fetch file component properties', error);
            throw error;
        }
    },

    // Get component properties from Figma
    getComponentProperties: async (fileKey: string, nodeId: string) => {
        console.log('📋 FigmaService: Fetching component properties', { fileKey, nodeId });

        try {
            const response = await fetch(`/api/figma/component/${fileKey}/${nodeId}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                const error = new Error(errorData.error || 'Failed to fetch component properties') as ExtendedError;
                error.response = { status: response.status, data: errorData };
                throw error;
            }

            const data = await response.json();
            console.log('✅ FigmaService: Component properties received', data);
            return data;
        } catch (error) {
            console.error('❌ FigmaService: Failed to fetch component properties', error);
            throw error;
        }
    },

    // Get design context (tokens) for a component
    getDesignContext: async (fileKey: string, nodeId: string) => {
        console.log('🎨 FigmaService: Fetching design context', { fileKey, nodeId });

        try {
            const response = await fetch(`/api/figma/design-context/${fileKey}/${nodeId}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                const error = new Error(errorData.error || 'Failed to fetch design context') as ExtendedError;
                error.response = { status: response.status, data: errorData };
                throw error;
            }

            const data = await response.json();
            console.log('✅ FigmaService: Design context received', {
                nodeId: data.nodeId,
                colorsCount: data.colors?.length || 0,
                typographyCount: data.typography?.length || 0,
                effectsCount: data.effects?.length || 0
            });
            return data;
        } catch (error) {
            console.error('❌ FigmaService: Failed to fetch design context', error);
            throw error;
        }
    },

    // Deep extract comprehensive component data for AI analysis
    // Extracts: visual properties, layout, typography, structure, and infers tokens
    deepExtract: async (fileKey: string, nodeId: string) => {
        console.log('🔬 FigmaService: Deep extracting component', { fileKey, nodeId });

        try {
            const response = await fetch(`/api/figma/deep-extract/${fileKey}/${nodeId}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                const error = new Error(errorData.error || 'Failed to deep extract component') as ExtendedError;
                error.response = { status: response.status, data: errorData };
                throw error;
            }

            const data = await response.json();
            console.log('✅ FigmaService: Deep extraction complete', {
                nodeName: data.meta?.nodeName,
                stats: data.stats,
                inferredTokens: Object.keys(data.inferredTokens || {}).length
            });
            return data;
        } catch (error) {
            console.error('❌ FigmaService: Failed to deep extract', error);
            throw error;
        }
    },

    // Clear cache for a file and reload fresh data
    clearCacheAndReload: async (figmaUrl: string) => {
        const fileKey = extractFileKey(figmaUrl);
        if (!fileKey) throw new Error('Invalid Figma URL');

        console.log('🗑️ FigmaService: Clearing cache for', fileKey);

        // Clear the cache
        await axios.delete(`/figma/cache/file/${fileKey}`);

        // Reload the file fresh with depth=3 for performance
        const response = await axios.get(`/figma/file/${fileKey}`, { params: { depth: 3 } });
        return response.data;
    },
};

function extractFileKey(url: string): string | null {
    const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}