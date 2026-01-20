'use strict'
import express from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import crypto from 'crypto';
import { User } from './db/mongo/schemas.js';

const router = express.Router();

// Validate required environment variables
if (!process.env.BAI_JWT_SECRET || process.env.BAI_JWT_SECRET.length < 32) {
    throw new Error('BAI_JWT_SECRET must be set and at least 32 characters long');
}

if (!process.env.BAI_FIGMA_CLIENT_ID || !process.env.BAI_FIGMA_CLIENT_SECRET) {
    throw new Error('Figma OAuth credentials must be configured');
}

// Store PKCE challenges temporarily (in production, use Redis)
const pkceStore = new Map();
const stateStore = new Map();

// Helper functions for PKCE
function generateCodeVerifier() {
    return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(codeVerifier) {
    return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
}

function generateSecureState() {
    return crypto.randomBytes(32).toString('hex');
}


router.get('/', (req, res) => {
    res.send('Entered auth')
})

router.get('/figma/login', (req, res) => {
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateSecureState();
    
    // Store PKCE challenge and state (expires in 10 minutes)
    const sessionId = crypto.randomUUID();
    pkceStore.set(sessionId, { codeVerifier, timestamp: Date.now() });
    stateStore.set(state, { sessionId, timestamp: Date.now() });
    
    // Clean up expired entries
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const [key, value] of pkceStore.entries()) {
        if (value.timestamp < tenMinutesAgo) {
            pkceStore.delete(key);
        }
    }
    for (const [key, value] of stateStore.entries()) {
        if (value.timestamp < tenMinutesAgo) {
            stateStore.delete(key);
        }
    }
    
    // Build secure OAuth URL with PKCE
    // Using new granular scopes (file_read is deprecated as of Nov 2025)
    const authUrl = `https://www.figma.com/oauth?` +
        `client_id=${process.env.BAI_FIGMA_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(process.env.BAI_FIGMA_REDIRECT_URI)}&` +
        `scope=current_user:read,file_content:read,file_metadata:read&` +
        `response_type=code&` +
        `state=${state}&` +
        `code_challenge=${codeChallenge}&` +
        `code_challenge_method=S256`;

    res.redirect(authUrl);
})

router.get('/figma/callback', async (req, res) => {
    const { code, state } = req.query;

    try {
        // Validate state parameter
        if (!state || !stateStore.has(state)) {
            console.error('Invalid or missing state parameter');
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_state`);
        }
        
        const stateData = stateStore.get(state);
        const pkceData = pkceStore.get(stateData.sessionId);
        
        if (!pkceData) {
            console.error('PKCE data not found');
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=pkce_missing`);
        }
        
        // Clean up used state and PKCE data
        stateStore.delete(state);
        pkceStore.delete(stateData.sessionId);
        // Create Basic Auth header
        const credentials = `${process.env.BAI_FIGMA_CLIENT_ID}:${process.env.BAI_FIGMA_CLIENT_SECRET}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        console.log('Attempting token exchange with:', {
            client_id: process.env.BAI_FIGMA_CLIENT_ID,
            redirect_uri: process.env.BAI_FIGMA_REDIRECT_URI,
            has_code: !!code,
            has_verifier: !!pkceData.codeVerifier
        });
        // Exchange code for access token with PKCE - Following Figma's documentation
        const tokenResponse = await axios.post('https://api.figma.com/v1/oauth/token',
            new URLSearchParams({
                redirect_uri: process.env.BAI_FIGMA_REDIRECT_URI,
                code,
                grant_type: 'authorization_code',
                code_verifier: pkceData.codeVerifier
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${encodedCredentials}`
                }
            }
        );

        const { access_token, refresh_token, user_id_string } = tokenResponse.data;

        // Get user info from Figma
        const userResponse = await axios.get('https://api.figma.com/v1/me', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });

        const figmaUser = userResponse.data;


        // Save/update user in MongoDB
        let user = await User.findOne({ figmaId: user_id_string });
        if (!user) {
            user = new User({
                figmaId: user_id_string,
                email: figmaUser.email,
                name: figmaUser.handle,
                figmaToken: access_token,
                refreshToken: refresh_token
            });
        } else {
            user.figmaToken = access_token;
            user.refreshToken = refresh_token;
        }
        await user.save();

        // Create JWT with additional claims for security
        const token = jwt.sign(
            { 
                userId: user._id,
                figmaId: user.figmaId,
                iat: Math.floor(Date.now() / 1000),
                iss: 'uiforge-ai'
            }, 
            process.env.BAI_JWT_SECRET, 
            { 
                expiresIn: '7d',
                algorithm: 'HS256'
            }
        );

        // Set JWT as secure httpOnly cookie
        // Use sameSite: 'none' for cross-origin cookies (Vercel frontend + Railway backend)
        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // Required for sameSite: 'none'
            sameSite: 'none', // Required for cross-origin cookies
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/'
        });

        console.log('OAuth successful, redirecting to:', `${process.env.FRONTEND_URL}/design`);

        // Redirect back to frontend
        res.redirect(`${process.env.FRONTEND_URL}/design`);
    } catch (err) {
        console.error('OAuth callback error:', err.message);
        console.error('Error details:', {
            status: err.response?.status,
            data: err.response?.data,
            config: {
                url: err.config?.url,
                method: err.config?.method
            }
        });
        // Don't expose internal error details to client
        const errorType = err.response?.status === 400 ? 'invalid_grant' : 'auth_failed';
        res.redirect(`${process.env.FRONTEND_URL}/login?error=${errorType}`);
    }

});

// Check current user authentication
router.get('/me', async (req, res) => {
    console.log('/auth/me called - cookies received:', Object.keys(req.cookies || {}));
    console.log('/auth/me - has token cookie:', !!req.cookies?.token);

    try {
        const token = req.cookies.token;
        if (!token) {
            console.log('/auth/me - No token cookie found');
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const decoded = jwt.verify(token, process.env.BAI_JWT_SECRET, {
            algorithms: ['HS256'],
            issuer: 'uiforge-ai',
            maxAge: '7d'
        });
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        res.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                figmaId: user.figmaId
            }
        });
    } catch (err) {
        console.error('Token verification error:', err.message);
        res.clearCookie('token');
        res.status(401).json({ error: 'Invalid or expired token' });
    }
});

// Logout endpoint
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/'
    });
    res.json({ message: 'Logged out successfully' });
});

export default router;
