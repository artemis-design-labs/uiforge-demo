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
    loadFile: async (figmaUrl: string, options?: { partial?: boolean }) => {
        const fileKey = extractFileKey(figmaUrl);
        if (!fileKey) throw new Error('Invalid Figma URL');

        const params = options?.partial ? { partial: true } : {};
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

    // Clear cache for a file and reload fresh data
    clearCacheAndReload: async (figmaUrl: string) => {
        const fileKey = extractFileKey(figmaUrl);
        if (!fileKey) throw new Error('Invalid Figma URL');

        console.log('🗑️ FigmaService: Clearing cache for', fileKey);

        // Clear the cache
        await axios.delete(`/figma/cache/file/${fileKey}`);

        // Reload the file fresh
        const response = await axios.get(`/figma/file/${fileKey}`);
        return response.data;
    },
};

function extractFileKey(url: string): string | null {
    const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}