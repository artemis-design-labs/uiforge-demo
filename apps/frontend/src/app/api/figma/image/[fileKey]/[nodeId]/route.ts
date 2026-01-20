import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://uiforge-demo-production.up.railway.app';

// Fetch component image - proxy through Railway to use user's OAuth token
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

        // Get user's auth token from cookie
        const token = request.cookies.get('token')?.value;

        // If user is logged in, proxy through Railway to use their OAuth token
        if (token) {
            console.log(`[Figma API] Using OAuth token via Railway for ${nodeId}`);

            const railwayResponse = await fetch(
                `${BACKEND_URL}/api/v1/figma/image/${fileKey}/${nodeId}?scale=${scale}&format=${format}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (railwayResponse.ok) {
                const data = await railwayResponse.json();
                return NextResponse.json(data);
            }

            // If Railway fails, fall back to PAT
            console.log(`[Figma API] Railway failed (${railwayResponse.status}), falling back to PAT`);
        }

        // Fallback: Use PAT from environment
        const figmaToken = process.env.FIGMA_ACCESS_TOKEN;

        // Debug: Log token presence (not the actual token)
        console.log(`[Figma API] Token present: ${!!figmaToken}, Token length: ${figmaToken?.length || 0}`);

        if (!figmaToken) {
            return NextResponse.json(
                { error: 'Figma access token not configured. Please add FIGMA_ACCESS_TOKEN to environment variables.' },
                { status: 500 }
            );
        }

        // Validate token format (Figma PATs start with "figd_")
        if (!figmaToken.startsWith('figd_')) {
            console.error('[Figma API] Token does not have expected format (should start with figd_)');
            return NextResponse.json(
                { error: 'Invalid Figma token format. Personal access tokens should start with "figd_"' },
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
                    {
                        error: 'Access denied. The Figma token may not have access to this file.',
                        details: 'Ensure the token owner has access to the Figma file.',
                        status: 403
                    },
                    { status: 403 }
                );
            }

            if (figmaResponse.status === 404) {
                return NextResponse.json(
                    {
                        error: 'File or node not found in Figma.',
                        details: `File: ${fileKey}, Node: ${nodeId}`,
                        status: 404
                    },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                { error: errorData.message || errorData.err || 'Failed to fetch image from Figma', status: figmaResponse.status },
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
