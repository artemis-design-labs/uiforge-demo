import { NextResponse } from 'next/server';

// Test endpoint to verify Figma token configuration
export async function GET() {
    const figmaToken = process.env.FIGMA_ACCESS_TOKEN;

    // Check if token exists
    if (!figmaToken) {
        return NextResponse.json({
            status: 'error',
            message: 'FIGMA_ACCESS_TOKEN environment variable is not set',
            tokenPresent: false,
        }, { status: 500 });
    }

    // Check token format
    if (!figmaToken.startsWith('figd_')) {
        return NextResponse.json({
            status: 'error',
            message: 'Token does not have expected format (should start with "figd_")',
            tokenPresent: true,
            tokenLength: figmaToken.length,
            tokenPrefix: figmaToken.substring(0, 10) + '...',
        }, { status: 500 });
    }

    // Test token by calling Figma /me endpoint
    try {
        const response = await fetch('https://api.figma.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${figmaToken}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json({
                status: 'error',
                message: 'Token is invalid or expired',
                figmaStatus: response.status,
                figmaError: errorData,
                tokenPresent: true,
                tokenLength: figmaToken.length,
            }, { status: 401 });
        }

        const userData = await response.json();
        return NextResponse.json({
            status: 'ok',
            message: 'Figma token is valid',
            tokenPresent: true,
            tokenLength: figmaToken.length,
            user: {
                id: userData.id,
                email: userData.email,
                handle: userData.handle,
            },
        });
    } catch (error) {
        return NextResponse.json({
            status: 'error',
            message: 'Failed to verify token with Figma API',
            error: error instanceof Error ? error.message : 'Unknown error',
            tokenPresent: true,
            tokenLength: figmaToken.length,
        }, { status: 500 });
    }
}
