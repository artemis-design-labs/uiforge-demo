import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ActivityLog {
    activityType: string;
    action: string;
    metadata?: Record<string, any>;
    fileKey?: string;
    nodeId?: string;
    duration?: number;
    success?: boolean;
    errorMessage?: string;
}

// Queue for batching non-critical activities
let activityQueue: ActivityLog[] = [];
let batchTimer: NodeJS.Timeout | null = null;
const BATCH_INTERVAL = 30000; // 30 seconds
const MAX_QUEUE_SIZE = 50;

class ActivityLogger {
    private static instance: ActivityLogger;

    private constructor() {}

    static getInstance(): ActivityLogger {
        if (!ActivityLogger.instance) {
            ActivityLogger.instance = new ActivityLogger();
        }
        return ActivityLogger.instance;
    }

    /**
     * Log critical activities immediately (user_login, figma_file_opened)
     */
    async logCritical(activity: ActivityLog): Promise<void> {
        // Temporarily disabled - backend endpoint not implemented yet
        // try {
        //     await axios.post(`${API_URL}/api/activity/log`, activity, {
        //         headers: {
        //             'Authorization': `Bearer ${this.getAuthToken()}`
        //         }
        //     });
        // } catch (error) {
        //     console.error('Failed to log critical activity:', error);
        // }
    }

    /**
     * Queue non-critical activities for batch sending
     */
    queueActivity(activity: ActivityLog): void {
        activityQueue.push(activity);

        // Send immediately if queue is full
        if (activityQueue.length >= MAX_QUEUE_SIZE) {
            this.flushQueue();
            return;
        }

        // Setup batch timer if not already running
        if (!batchTimer) {
            batchTimer = setTimeout(() => {
                this.flushQueue();
            }, BATCH_INTERVAL);
        }
    }

    /**
     * Flush queued activities to backend
     */
    async flushQueue(): Promise<void> {
        if (activityQueue.length === 0) return;

        // Clear the queue
        activityQueue = [];

        if (batchTimer) {
            clearTimeout(batchTimer);
            batchTimer = null;
        }

        // Temporarily disabled - backend endpoint not implemented yet
        // try {
        //     await axios.post(`${API_URL}/api/activity/log-batch`, { activities }, {
        //         headers: {
        //             'Authorization': `Bearer ${this.getAuthToken()}`
        //         }
        //     });
        // } catch (error) {
        //     console.error('Failed to flush activity queue:', error);
        //     // Re-queue failed activities
        //     activityQueue = [...activities, ...activityQueue];
        // }
    }

    /**
     * Log user login
     */
    async logLogin(userId: string, email: string): Promise<void> {
        await this.logCritical({
            activityType: 'user_login',
            action: 'User logged in',
            metadata: { userId, email }
        });
    }

    /**
     * Log Figma file opened (critical)
     */
    async logFileOpened(fileKey: string, fileUrl: string): Promise<void> {
        await this.logCritical({
            activityType: 'figma_file_opened',
            action: 'Figma file opened',
            fileKey,
            metadata: { fileUrl }
        });
    }

    /**
     * Log component selection (batched)
     */
    logComponentSelected(fileKey: string, nodeId: string, nodeType: string): void {
        this.queueActivity({
            activityType: 'figma_component_selected',
            action: 'Component selected',
            fileKey,
            nodeId,
            metadata: { nodeType }
        });
    }

    /**
     * Log tree node expansion (batched)
     */
    logNodeExpanded(fileKey: string, nodeId: string, isExpanded: boolean): void {
        this.queueActivity({
            activityType: 'other',
            action: isExpanded ? 'Tree node expanded' : 'Tree node collapsed',
            fileKey,
            nodeId,
            metadata: { isExpanded }
        });
    }

    /**
     * Log search query (batched)
     */
    logSearch(fileKey: string, searchQuery: string): void {
        this.queueActivity({
            activityType: 'other',
            action: 'Tree search performed',
            fileKey,
            metadata: { searchQuery }
        });
    }

    /**
     * Get auth token from localStorage
     */
    private getAuthToken(): string {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('authToken') || '';
        }
        return '';
    }
}

// Export singleton instance
export const activityLogger = ActivityLogger.getInstance();

// Flush queue before page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        activityLogger.flushQueue();
    });
}
