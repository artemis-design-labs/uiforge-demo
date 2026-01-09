'use stric'
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    figmaId: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        require: true
    },
    name: {
        required: true,
        type: String
    },
    figmaToken: {
        type: String,
        required: true
    },
    figmaState: {
        currentFileKey: String,
        currentFileUrl: String,
        expandedNodes: [String],
        recentFiles: [{
            fileKey: String,
            fileUrl: String,
            fileName: String,
            lastOpened: Number,
        }],
        lastSynced: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const componentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileKey: {
        type: String,
        required: true
    },
    nodeId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    figmaData: {
        type: Object,
        required: true
    },
    generatedCode: String,
    modifiedCode: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Schema for caching Figma file data
const figmaFileSchema = new mongoose.Schema({
    fileKey: {
        type: String,
        unique: true,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    tree: {
        type: Object,
        required: false // Will be null if compressed
    },
    compressedTree: {
        type: Buffer,
        required: false // Compressed data for large files
    },
    isCompressed: {
        type: Boolean,
        default: false
    },
    originalSize: {
        type: Number,
        required: false
    },
    lastModified: {
        type: Date,
        required: true
    },
    cachedAt: {
        type: Date,
        default: Date.now
    }
});

// Schema for caching Figma instance/node data
const figmaInstanceSchema = new mongoose.Schema({
    fileKey: {
        type: String,
        required: true
    },
    nodeId: {
        type: String,
        required: true
    },
    data: {
        type: Object,
        required: false // Will be null if compressed
    },
    compressedData: {
        type: Buffer,
        required: false // Compressed data for large nodes
    },
    isCompressed: {
        type: Boolean,
        default: false
    },
    originalSize: {
        type: Number,
        required: false
    },
    lastModified: {
        type: Date,
        required: true
    },
    thumbnailUrl: String,
    cachedAt: {
        type: Date,
        default: Date.now
    }
});

// Create compound unique index for fileKey + nodeId combination
figmaInstanceSchema.index({ fileKey: 1, nodeId: 1 }, { unique: true });

// Schema for logging user activities and workflows for AI training
const userActivityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    activityType: {
        type: String,
        required: true,
        enum: [
            'figma_file_opened',
            'figma_component_selected',
            'code_generated',
            'code_modified',
            'code_exported',
            'component_created',
            'component_updated',
            'component_deleted',
            'figma_auth',
            'figma_file_cached',
            'user_login',
            'user_logout',
            'api_call',
            'error_occurred',
            'other'
        ]
    },
    action: {
        type: String,
        required: true
    },
    metadata: {
        type: Object,
        default: {}
    },
    fileKey: String,
    nodeId: String,
    componentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Component'
    },
    duration: Number, // Duration in milliseconds if applicable
    success: {
        type: Boolean,
        default: true
    },
    errorMessage: String,
    ipAddress: String,
    userAgent: String,
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Create compound index for efficient querying by user and time
userActivityLogSchema.index({ userId: 1, timestamp: -1 });
userActivityLogSchema.index({ activityType: 1, timestamp: -1 });

// Schema for comprehensive error logging
const errorLogSchema = new mongoose.Schema({
    // Error identification
    errorId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },

    // Error classification
    severity: {
        type: String,
        required: true,
        enum: ['critical', 'error', 'warning', 'info'],
        index: true
    },
    source: {
        type: String,
        required: true,
        enum: ['frontend', 'backend', 'api', 'database', 'auth', 'external'],
        index: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'authentication',
            'authorization',
            'validation',
            'database',
            'network',
            'figma_api',
            'code_generation',
            'file_processing',
            'unknown',
            'ui_render',
            'user_action'
        ],
        index: true
    },

    // Error details
    message: {
        type: String,
        required: true
    },
    errorName: String,
    errorCode: String,
    stack: String,

    // Context information
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    userEmail: String,

    // Request context
    url: String,
    method: String,
    endpoint: String,
    statusCode: Number,

    // Client information
    userAgent: String,
    browser: String,
    browserVersion: String,
    os: String,
    device: String,
    ipAddress: String,

    // Application context
    fileKey: String,
    nodeId: String,
    componentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Component'
    },

    // Additional metadata
    metadata: {
        type: Object,
        default: {}
    },

    // Request/Response data (for debugging)
    requestBody: Object,
    requestParams: Object,
    requestQuery: Object,
    responseData: Object,

    // Environment info
    environment: {
        type: String,
        enum: ['development', 'staging', 'production'],
        default: 'development'
    },
    appVersion: String,

    // Tracking
    occurrenceCount: {
        type: Number,
        default: 1
    },
    firstOccurrence: {
        type: Date,
        default: Date.now
    },
    lastOccurrence: {
        type: Date,
        default: Date.now
    },

    // Status
    resolved: {
        type: Boolean,
        default: false,
        index: true
    },
    resolvedAt: Date,
    resolvedBy: String,
    resolutionNotes: String,

    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Indexes for efficient querying
errorLogSchema.index({ timestamp: -1 });
errorLogSchema.index({ severity: 1, timestamp: -1 });
errorLogSchema.index({ source: 1, category: 1, timestamp: -1 });
errorLogSchema.index({ resolved: 1, severity: 1, timestamp: -1 });
errorLogSchema.index({ userId: 1, timestamp: -1 });

export const User = mongoose.model('User', userSchema);
export const Component = mongoose.model('Component', componentSchema);
export const FigmaFile = mongoose.model('FigmaFile', figmaFileSchema);
export const FigmaInstance = mongoose.model('FigmaInstance', figmaInstanceSchema);
export const UserActivityLog = mongoose.model('UserActivityLog', userActivityLogSchema);
export const ErrorLog = mongoose.model('ErrorLog', errorLogSchema);