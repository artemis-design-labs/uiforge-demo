import { NextRequest, NextResponse } from 'next/server';

// This endpoint receives the token from Railway and sets it as a cookie on Vercel's domain
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    // Handle errors from Railway
    if (error) {
        return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
    }

    if (!token) {
        return NextResponse.redirect(new URL('/login?error=no_token', request.url));
    }

    // Create response that redirects to /design
    const response = NextResponse.redirect(new URL('/design', request.url));

    // Set the token as an httpOnly cookie on Vercel's domain
    response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // 'lax' works for same-origin
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
    });

    return response;
}
