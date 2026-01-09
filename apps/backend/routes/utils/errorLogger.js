'use strict';
import { ErrorLog } from '../db/mongo/schemas.js';
import crypto from 'crypto';

/**
 * Generate a unique error ID based on error characteristics
 */
function generateErrorId(error, context = {}) {
    const uniqueString = `${error.name}-${error.message}-${context.endpoint || ''}`;
    return crypto.createHash('md5').update(uniqueString).digest('hex');
}

/**
 * Parse user agent string to extract browser, OS, and device info
 */
function parseUserAgent(userAgent) {
    if (!userAgent) return {};

    const result = {
        browser: 'Unknown',
        browserVersion: '',
        os: 'Unknown',
        device: 'Desktop'
    };

    // Browser detection
    if (userAgent.includes('Chrome')) {
        result.browser = 'Chrome';
        const match = userAgent.match(/Chrome\/([\d.]+)/);
        result.browserVersion = match ? match[1] : '';
    } else if (userAgent.includes('Firefox')) {
        result.browser = 'Firefox';
        const match = userAgent.match(/Firefox\/([\d.]+)/);
        result.browserVersion = match ? match[1] : '';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        result.browser = 'Safari';
        const match = userAgent.match(/Version\/([\d.]+)/);
        result.browserVersion = match ? match[1] : '';
    } else if (userAgent.includes('Edge')) {
        result.browser = 'Edge';
        const match = userAgent.match(/Edge\/([\d.]+)/);
        result.browserVersion = match ? match[1] : '';
    }

    // OS detection
    if (userAgent.includes('Windows')) result.os = 'Windows';
    else if (userAgent.includes('Mac')) result.os = 'macOS';
    else if (userAgent.includes('Linux')) result.os = 'Linux';
    else if (userAgent.includes('Android')) result.os = 'Android';
    else if (userAgent.includes('iOS')) result.os = 'iOS';

    // Device detection
    if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
        result.device = 'Mobile';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
        result.device = 'Tablet';
    }

    return result;
}

/**
 * Determine error severity based on error characteristics
 */
function determineSeverity(error, context = {}) {
    if (context.severity) return context.severity;

    // Critical errors
    if (error.name === 'DatabaseError' || error.message.includes('ECONNREFUSED')) {
        return 'critical';
    }

    // Regular errors
    if (error.statusCode >= 500 || !error.statusCode) {
        return 'error';
    }

    // Warnings
    if (error.statusCode >= 400 && error.statusCode < 500) {
        return 'warning';
    }

    return 'info';
}

/**
 * Determine error category based on context and error type
 */
function determineCategory(error, context = {}) {
    if (context.category) return context.category;

    const message = error.message.toLowerCase();
    const stack = error.stack ? error.stack.toLowerCase() : '';

    if (message.includes('auth') || message.includes('token') || message.includes('login')) {
        return 'authentication';
    }
    if (message.includes('permission') || message.includes('forbidden')) {
        return 'authorization';
    }
    if (message.includes('validation') || message.includes('invalid')) {
        return 'validation';
    }
    if (message.includes('database') || message.includes('mongo') || message.includes('query')) {
        return 'database';
    }
    if (message.includes('network') || message.includes('timeout') || message.includes('econnrefused')) {
        return 'network';
    }
    if (message.includes('figma') || stack.includes('figma')) {
        return 'figma_api';
    }
    if (message.includes('render') || message.includes('component')) {
        return 'ui_render';
    }

    return 'unknown';
}

/**
 * Log an error to MongoDB
 */
export async function logError(error, context = {}) {
    try {
        const errorId = generateErrorId(error, context);
        const userAgentInfo = parseUserAgent(context.userAgent);
        const severity = determineSeverity(error, context);
        const category = determineCategory(error, context);

        // Check if this error already exists
        const existingError = await ErrorLog.findOne({ errorId });

        if (existingError) {
            // Update existing error with new occurrence
            existingError.occurrenceCount += 1;
            existingError.lastOccurrence = new Date();

            // Update metadata if new info is available
            if (context.metadata) {
                existingError.metadata = { ...existingError.metadata, ...context.metadata };
            }

            await existingError.save();
            console.log(`Updated existing error log: ${errorId} (occurrence #${existingError.occurrenceCount})`);
            return existingError;
        }

        // Create new error log entry
        const errorLog = new ErrorLog({
            errorId,
            severity,
            source: context.source || 'backend',
            category,

            // Error details
            message: error.message || 'Unknown error',
            errorName: error.name || 'Error',
            errorCode: error.code || context.errorCode,
            stack: error.stack,

            // Context
            userId: context.userId,
            userEmail: context.userEmail,

            // Request context
            url: context.url,
            method: context.method,
            endpoint: context.endpoint,
            statusCode: error.statusCode || context.statusCode,

            // Client info
            userAgent: context.userAgent,
            ...userAgentInfo,
            ipAddress: context.ipAddress,

            // App context
            fileKey: context.fileKey,
            nodeId: context.nodeId,
            componentId: context.componentId,

            // Additional data
            metadata: context.metadata || {},
            requestBody: context.requestBody,
            requestParams: context.requestParams,
            requestQuery: context.requestQuery,
            responseData: context.responseData,

            // Environment
            environment: process.env.NODE_ENV || 'development',
            appVersion: context.appVersion || process.env.npm_package_version,
        });

        await errorLog.save();
        console.log(`Logged new error: ${errorId} [${severity}] ${error.message}`);
        return errorLog;
    } catch (loggingError) {
        // Don't let error logging break the application
        console.error('Failed to log error to database:', loggingError);
        console.error('Original error:', error);
        return null;
    }
}

/**
 * Express middleware for error logging
 */
export function errorLoggingMiddleware(err, req, res, next) {
    // Extract user info if available
    const userId = req.user?.userId;
    const userEmail = req.user?.email;

    // Log the error
    logError(err, {
        source: 'backend',
        url: req.originalUrl || req.url,
        method: req.method,
        endpoint: req.route?.path,
        userAgent: req.get('user-agent'),
        ipAddress: req.ip || req.connection.remoteAddress,
        userId,
        userEmail,
        requestBody: req.body,
        requestParams: req.params,
        requestQuery: req.query,
    });

    // Continue to next error handler
    next(err);
}

/**
 * Get error statistics
 */
export async function getErrorStats(filters = {}) {
    try {
        const query = {};

        if (filters.startDate) {
            query.timestamp = { $gte: new Date(filters.startDate) };
        }
        if (filters.endDate) {
            query.timestamp = { ...query.timestamp, $lte: new Date(filters.endDate) };
        }
        if (filters.severity) {
            query.severity = filters.severity;
        }
        if (filters.source) {
            query.source = filters.source;
        }
        if (filters.category) {
            query.category = filters.category;
        }
        if (filters.resolved !== undefined) {
            query.resolved = filters.resolved;
        }

        const stats = await ErrorLog.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        severity: '$severity',
                        category: '$category',
                        source: '$source'
                    },
                    count: { $sum: '$occurrenceCount' },
                    uniqueErrors: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const total = await ErrorLog.countDocuments(query);
        const totalOccurrences = await ErrorLog.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: '$occurrenceCount' } } }
        ]);

        return {
            total,
            totalOccurrences: totalOccurrences[0]?.total || 0,
            breakdown: stats
        };
    } catch (error) {
        console.error('Failed to get error stats:', error);
        return null;
    }
}
