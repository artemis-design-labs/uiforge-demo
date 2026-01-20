import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://uiforge-demo-production.up.railway.app';

// Proxy /auth/me to Railway, passing the token from cookie
export async function GET(request: NextRequest) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Call Railway backend with token in Authorization header
        const response = await fetch(`${BACKEND_URL}/api/v1/auth/me-with-token`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            // Clear invalid token
            const errorResponse = NextResponse.json(data, { status: response.status });
            errorResponse.cookies.delete('token');
            return errorResponse;
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Auth check error:', error);
        return NextResponse.json({ error: 'Auth check failed' }, { status: 500 });
    }
}
