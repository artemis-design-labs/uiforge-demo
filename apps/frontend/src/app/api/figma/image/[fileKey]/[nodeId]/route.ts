import { NextRequest, NextResponse } from 'next/server';

// Fetch component image directly from Figma API
// Uses server-side Figma token to bypass backend dependency
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ fileKey: string; nodeId: string }> }
) {
    try {
        const { fileKey, nodeId } = await params;
        const searchParams = request.nextUrl.searchParams;
        const scale = Math.min(Math.max(parseFloat(searchParams.get('scale') || '2'), 0.5), 4);
        const format = ['png', 'jpg', 'svg', 'pdf'].includes(searchParams.get('format') || '')
            ? searchParams.get('format')
            : 'png';

        // Get Figma token from environment
        const figmaToken = process.env.FIGMA_ACCESS_TOKEN;

        if (!figmaToken) {
            return NextResponse.json(
                { error: 'Figma access token not configured' },
                { status: 500 }
            );
        }

        console.log(`[Figma API] Fetching image for node ${nodeId} in file ${fileKey}`);

        // Call Figma Images API
        const figmaResponse = await fetch(
            `https://api.figma.com/v1/images/${fileKey}?ids=${nodeId}&scale=${scale}&format=${format}`,
            {
                headers: {
                    'Authorization': `Bearer ${figmaToken}`,
                },
            }
        );

        if (!figmaResponse.ok) {
            const errorData = await figmaResponse.json().catch(() => ({}));
            console.error('[Figma API] Error:', figmaResponse.status, errorData);

            if (figmaResponse.status === 403) {
                return NextResponse.json(
                    { error: 'Access denied. Check Figma token permissions.' },
                    { status: 403 }
                );
            }

            return NextResponse.json(
                { error: errorData.message || 'Failed to fetch image from Figma' },
                { status: figmaResponse.status }
            );
        }

        const data = await figmaResponse.json();
        const imageUrl = data.images?.[nodeId];

        if (!imageUrl) {
            return NextResponse.json(
                { error: 'Image not found for this node' },
                { status: 404 }
            );
        }

        console.log(`[Figma API] Image URL retrieved for ${nodeId}`);

        return NextResponse.json({
            nodeId,
            fileKey,
            imageUrl,
            scale,
            format,
        });
    } catch (error) {
        console.error('[Figma API] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
