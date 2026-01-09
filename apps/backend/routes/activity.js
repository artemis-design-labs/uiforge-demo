import express from 'express';
import { UserActivityLog } from './db/mongo/schemas.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

/**
 * Log a single activity (for critical events)
 * POST /api/activity/log
 */
router.post('/log', authenticateUser, async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const {
            activityType,
            action,
            metadata,
            fileKey,
            nodeId,
            duration,
            success,
            errorMessage,
        } = req.body;

        const activity = new UserActivityLog({
            userId,
            activityType,
            action,
            metadata: metadata || {},
            fileKey,
            nodeId,
            duration,
            success: success !== undefined ? success : true,
            errorMessage,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
        });

        await activity.save();

        res.status(201).json({ message: 'Activity logged successfully' });
    } catch (error) {
        console.error('Error logging activity:', error);
        res.status(500).json({ error: 'Failed to log activity' });
    }
});

/**
 * Log multiple activities in batch (for non-critical events)
 * POST /api/activity/log-batch
 */
router.post('/log-batch', authenticateUser, async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { activities } = req.body;

        if (!Array.isArray(activities) || activities.length === 0) {
            return res.status(400).json({ error: 'Activities array is required' });
        }

        const activityDocs = activities.map((activity) => ({
            userId,
            activityType: activity.activityType,
            action: activity.action,
            metadata: activity.metadata || {},
            fileKey: activity.fileKey,
            nodeId: activity.nodeId,
            duration: activity.duration,
            success: activity.success !== undefined ? activity.success : true,
            errorMessage: activity.errorMessage,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
        }));

        await UserActivityLog.insertMany(activityDocs);

        res.status(201).json({
            message: `${activities.length} activities logged successfully`
        });
    } catch (error) {
        console.error('Error logging batch activities:', error);
        res.status(500).json({ error: 'Failed to log activities' });
    }
});

/**
 * Get user's activity history
 * GET /api/activity/history?limit=50&activityType=figma_file_opened
 */
router.get('/history', authenticateUser, async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { limit = 50, activityType, startDate, endDate } = req.query;

        const query = { userId };

        if (activityType) {
            query.activityType = activityType;
        }

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const activities = await UserActivityLog.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .lean();

        res.json({ activities });
    } catch (error) {
        console.error('Error fetching activity history:', error);
        res.status(500).json({ error: 'Failed to fetch activity history' });
    }
});

/**
 * Get recently opened files
 * GET /api/activity/recent-files?limit=5
 */
router.get('/recent-files', authenticateUser, async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { limit = 5 } = req.query;

        const recentFiles = await UserActivityLog.aggregate([
            {
                $match: {
                    userId,
                    activityType: 'figma_file_opened',
                    fileKey: { $exists: true },
                },
            },
            {
                $sort: { timestamp: -1 },
            },
            {
                $group: {
                    _id: '$fileKey',
                    fileKey: { $first: '$fileKey' },
                    fileUrl: { $first: '$metadata.fileUrl' },
                    lastOpened: { $first: '$timestamp' },
                },
            },
            {
                $sort: { lastOpened: -1 },
            },
            {
                $limit: parseInt(limit),
            },
        ]);

        res.json({ recentFiles });
    } catch (error) {
        console.error('Error fetching recent files:', error);
        res.status(500).json({ error: 'Failed to fetch recent files' });
    }
});

export default router;
