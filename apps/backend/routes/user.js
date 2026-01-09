import express from 'express';
import { User } from './db/mongo/schemas.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

/**
 * Sync user state (figma state, recent files, etc.)
 * POST /api/user/sync-state
 */
router.post('/sync-state', authenticateUser, async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { figmaState } = req.body;

        // Update user document with latest state
        await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    figmaState: {
                        currentFileKey: figmaState?.currentFileKey,
                        currentFileUrl: figmaState?.currentFileUrl,
                        expandedNodes: figmaState?.expandedNodes || [],
                        recentFiles: figmaState?.recentFiles || [],
                        lastSynced: new Date(),
                    },
                },
            },
            { new: true, upsert: false }
        );

        res.json({ message: 'State synced successfully' });
    } catch (error) {
        console.error('Error syncing state:', error);
        res.status(500).json({ error: 'Failed to sync state' });
    }
});

/**
 * Get user's synced state
 * GET /api/user/state
 */
router.get('/state', authenticateUser, async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await User.findById(userId).select('figmaState').lean();

        if (!user || !user.figmaState) {
            return res.json({ figmaState: null });
        }

        res.json({ figmaState: user.figmaState });
    } catch (error) {
        console.error('Error fetching state:', error);
        res.status(500).json({ error: 'Failed to fetch state' });
    }
});

export default router;
