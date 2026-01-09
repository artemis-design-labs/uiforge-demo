'use strict';
import express from 'express';
import { ErrorLog } from './db/mongo/schemas.js';
import { logError, getErrorStats } from './utils/errorLogger.js';

const router = express.Router();

/**
 * POST /api/v1/errors/log
 * Log an error from the frontend or external source
 */
router.post('/log', async (req, res) => {
    try {
        const {
            error,
            source = 'frontend',
            severity,
            category,
            metadata,
            fileKey,
            nodeId,
            url,
            userAgent,
        } = req.body;

        if (!error || !error.message) {
            return res.status(400).json({ error: 'Error message is required' });
        }

        // Create error object
        const errorObj = {
            name: error.name || 'Error',
            message: error.message,
            stack: error.stack,
            code: error.code,
        };

        // Build context
        const context = {
            source,
            severity,
            category,
            metadata,
            fileKey,
            nodeId,
            url: url || req.get('referer'),
            userAgent: userAgent || req.get('user-agent'),
            ipAddress: req.ip || req.connection.remoteAddress,
            userId: req.user?.userId,
            userEmail: req.user?.email,
        };

        const errorLog = await logError(errorObj, context);

        res.json({
            success: true,
            errorId: errorLog?.errorId,
            message: 'Error logged successfully'
        });
    } catch (err) {
        console.error('Failed to log error via API:', err);
        res.status(500).json({ error: 'Failed to log error' });
    }
});

/**
 * GET /api/v1/errors
 * Get error logs with filtering and pagination
 */
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            severity,
            source,
            category,
            resolved,
            startDate,
            endDate,
            userId,
            search
        } = req.query;

        // Build query
        const query = {};

        if (severity) query.severity = severity;
        if (source) query.source = source;
        if (category) query.category = category;
        if (resolved !== undefined) query.resolved = resolved === 'true';
        if (userId) query.userId = userId;

        // Date range filter
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        // Search in error message
        if (search) {
            query.$or = [
                { message: { $regex: search, $options: 'i' } },
                { errorName: { $regex: search, $options: 'i' } },
                { errorCode: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [errors, total] = await Promise.all([
            ErrorLog.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .select('-stack -requestBody -requestParams -requestQuery -responseData')
                .lean(),
            ErrorLog.countDocuments(query)
        ]);

        res.json({
            errors,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('Failed to get error logs:', err);
        res.status(500).json({ error: 'Failed to retrieve error logs' });
    }
});

/**
 * GET /api/v1/errors/stats
 * Get error statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const { startDate, endDate, severity, source, category, resolved } = req.query;

        const stats = await getErrorStats({
            startDate,
            endDate,
            severity,
            source,
            category,
            resolved: resolved !== undefined ? resolved === 'true' : undefined
        });

        res.json(stats);
    } catch (err) {
        console.error('Failed to get error stats:', err);
        res.status(500).json({ error: 'Failed to retrieve error statistics' });
    }
});

/**
 * GET /api/v1/errors/:errorId
 * Get detailed error information by errorId
 */
router.get('/:errorId', async (req, res) => {
    try {
        const { errorId } = req.params;

        const error = await ErrorLog.findOne({ errorId }).lean();

        if (!error) {
            return res.status(404).json({ error: 'Error not found' });
        }

        res.json(error);
    } catch (err) {
        console.error('Failed to get error details:', err);
        res.status(500).json({ error: 'Failed to retrieve error details' });
    }
});

/**
 * PATCH /api/v1/errors/:errorId/resolve
 * Mark an error as resolved
 */
router.patch('/:errorId/resolve', async (req, res) => {
    try {
        const { errorId } = req.params;
        const { resolutionNotes, resolvedBy } = req.body;

        const error = await ErrorLog.findOneAndUpdate(
            { errorId },
            {
                resolved: true,
                resolvedAt: new Date(),
                resolvedBy: resolvedBy || req.user?.email || 'System',
                resolutionNotes
            },
            { new: true }
        );

        if (!error) {
            return res.status(404).json({ error: 'Error not found' });
        }

        res.json({
            success: true,
            message: 'Error marked as resolved',
            error
        });
    } catch (err) {
        console.error('Failed to resolve error:', err);
        res.status(500).json({ error: 'Failed to resolve error' });
    }
});

/**
 * DELETE /api/v1/errors/:errorId
 * Delete an error log entry
 */
router.delete('/:errorId', async (req, res) => {
    try {
        const { errorId } = req.params;

        const error = await ErrorLog.findOneAndDelete({ errorId });

        if (!error) {
            return res.status(404).json({ error: 'Error not found' });
        }

        res.json({
            success: true,
            message: 'Error log deleted'
        });
    } catch (err) {
        console.error('Failed to delete error:', err);
        res.status(500).json({ error: 'Failed to delete error' });
    }
});

/**
 * GET /api/v1/errors/recent/summary
 * Get a summary of recent errors for dashboard
 */
router.get('/recent/summary', async (req, res) => {
    try {
        const { hours = 24 } = req.query;
        const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

        const [
            totalErrors,
            criticalErrors,
            unresolvedErrors,
            recentErrors,
            topCategories
        ] = await Promise.all([
            ErrorLog.countDocuments({ timestamp: { $gte: startDate } }),
            ErrorLog.countDocuments({
                timestamp: { $gte: startDate },
                severity: 'critical'
            }),
            ErrorLog.countDocuments({
                timestamp: { $gte: startDate },
                resolved: false
            }),
            ErrorLog.find({ timestamp: { $gte: startDate } })
                .sort({ timestamp: -1 })
                .limit(10)
                .select('-stack -requestBody -requestParams -requestQuery -responseData')
                .lean(),
            ErrorLog.aggregate([
                { $match: { timestamp: { $gte: startDate } } },
                { $group: {
                    _id: '$category',
                    count: { $sum: '$occurrenceCount' }
                }},
                { $sort: { count: -1 } },
                { $limit: 5 }
            ])
        ]);

        res.json({
            period: `Last ${hours} hours`,
            summary: {
                total: totalErrors,
                critical: criticalErrors,
                unresolved: unresolvedErrors
            },
            recentErrors,
            topCategories
        });
    } catch (err) {
        console.error('Failed to get error summary:', err);
        res.status(500).json({ error: 'Failed to retrieve error summary' });
    }
});

export default router;
