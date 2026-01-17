'use client';
import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedVariantId } from '@/store/figmaSlice';
import { figmaService } from '@/services/figma';

export default function HomePage() {
    const dispatch = useAppDispatch();
    const { selectedComponent, selectedVariantId, currentFileKey, instanceData } = useAppSelector((state) => state.figma);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Determine which node ID to display
    // For COMPONENT_SET: use selectedVariantId or first child
    // For others: use selectedComponent directly
    const getDisplayNodeId = (): string | null => {
        if (!selectedComponent) return null;

        // If we have instance data and it's a COMPONENT_SET with children
        if (instanceData?.data?.type === 'COMPONENT_SET' && instanceData.data.children?.length > 0) {
            // Use selected variant or default to first child
            if (selectedVariantId) {
                return selectedVariantId;
            }
            // Auto-select first variant
            const firstVariant = instanceData.data.children[0];
            if (firstVariant?.id) {
                dispatch(setSelectedVariantId(firstVariant.id));
                return firstVariant.id;
            }
        }

        return selectedComponent;
    };

    // Fetch component image when selection or variant changes
    useEffect(() => {
        const nodeIdToDisplay = getDisplayNodeId();

        if (!nodeIdToDisplay || !currentFileKey) {
            setImageUrl(null);
            return;
        }

        setLoading(true);
        setError(null);

        console.log('🖼️ Fetching image for node:', nodeIdToDisplay);

        figmaService.getComponentImage(currentFileKey, nodeIdToDisplay, { scale: 2 })
            .then((data) => {
                setImageUrl(data.imageUrl);
            })
            .catch((err) => {
                console.error('Failed to load component image:', err);
                setError('Failed to load component image');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [selectedComponent, selectedVariantId, currentFileKey, instanceData]);

    return (
        <div className="h-full w-full flex items-center justify-center bg-[#1e1e1e] overflow-auto">
            {loading ? (
                <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin h-8 w-8 text-white/50" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span className="text-white/50 text-sm">Loading component...</span>
                </div>
            ) : error ? (
                <div className="text-red-400 text-sm">{error}</div>
            ) : imageUrl ? (
                <div className="p-8">
                    <img
                        src={imageUrl}
                        alt="Selected component"
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                        style={{ background: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 20px 20px' }}
                    />
                </div>
            ) : (
                <div className="text-white/30 text-sm">
                    Select a component from the tree to preview it
                </div>
            )}
        </div>
    );
}