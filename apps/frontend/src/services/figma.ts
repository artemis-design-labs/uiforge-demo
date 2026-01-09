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
};

function extractFileKey(url: string): string | null {
    const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}