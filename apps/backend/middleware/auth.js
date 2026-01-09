import jwt from 'jsonwebtoken';
import { User } from '../routes/db/mongo/schemas.js';

/**
 * Fast JWT authentication (no database lookup)
 * Use for endpoints that only need user ID verification
 */
export function authenticateToken(req, res, next) {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.BAI_JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'uiforge-ai',
      maxAge: '7d'
    });

    // Add user info to request
    req.user = decoded;
    next();

  } catch (error) {
    console.error('Token verification error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Full user authentication with database validation
 * Use for endpoints that need full user data or must verify user still exists
 */
export async function authenticateUser(req, res, next) {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.BAI_JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'uiforge-ai',
      maxAge: '7d'
    });

    // Validate user exists in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Add full user object to request
    req.user = user;
    next();

  } catch (error) {
    console.error('Token verification error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 * Use for public endpoints that behave differently when authenticated
 */
export function optionalAuth(req, res, next) {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.BAI_JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'uiforge-ai',
        maxAge: '7d'
      });
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}

export default { authenticateToken, authenticateUser, optionalAuth };