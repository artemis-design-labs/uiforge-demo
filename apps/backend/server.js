import express from 'express';
import 'dotenv/config'
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';

// Import modules
import authRoutes from './routes/auth.js';
import { connect, disconnect } from './routes/db/mongo/mongoose.js';
import mongoRoutes from './routes/db/mongo/apis.js';
import figmaRoutes from './routes/figma.js';
import errorLogsRoutes from './routes/errorLogs.js';
import activityRoutes from './routes/activity.js';
import userRoutes from './routes/user.js';
import codegenRoutes from './routes/codegen.js';
import { errorLoggingMiddleware } from './routes/utils/errorLogger.js';


// Initialize Server Express App
const server = express();

// Security middleware
server.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Compression middleware (gzip/brotli)
server.use(compression({
    level: 6, // Compression level (0-9)
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// Rate limiting (PRODUCTION ONLY)
const isProduction = process.env.NODE_ENV === 'production';

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 10 : 1000, // 10 in prod, 1000 in dev (effectively disabled)
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !isProduction // Skip rate limiting in development
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 100 : 10000, // 100 in prod, 10000 in dev
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !isProduction // Skip rate limiting in development
});

server.use(express.json({ limit: '10mb' }));

// Apply general rate limiting (enabled in production only)
server.use(generalLimiter);

const port = 8000;

// Configure CORS with enhanced security
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.BAI_API_URL + ':' + process.env.BAI_UI_PORT,
            'http://localhost:3000', // Development frontend
            'https://localhost:3000'  // HTTPS development
        ];
        
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'Accept',
        'Origin'
    ],
    credentials: true,
    maxAge: 86400 // 24 hours
}
server.use(cors(corsOptions));

// Configure Cookies
server.use(cookieParser())

// Routes setup with rate limiting for auth endpoints (production only)
server.use(`${process.env.BAI_API_BASE_VERSION}/auth`, authLimiter, authRoutes);
server.use(`${process.env.BAI_API_BASE_VERSION}/figma`, figmaRoutes);
server.use(`${process.env.BAI_API_BASE_VERSION}/errors`, errorLogsRoutes);
server.use(`${process.env.BAI_API_BASE_VERSION}/activity`, activityRoutes);
server.use(`${process.env.BAI_API_BASE_VERSION}/user`, userRoutes);
server.use(`${process.env.BAI_API_BASE_VERSION}/codegen`, codegenRoutes);

// Error logging middleware (should be after routes but before error handlers)
server.use(errorLoggingMiddleware);

// Global error handler (production-optimized)
server.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    // Log error details (in production, this should go to a logging service)
    if (process.env.NODE_ENV === 'production') {
        // Production: Log minimal info, no console spam
        console.error(`[${new Date().toISOString()}] ${statusCode} - ${err.message}`);
    } else {
        // Development: Full error details
        console.error('Unhandled error:', err);
    }

    // Send response (hide details in production)
    res.status(statusCode).json({
        error: process.env.NODE_ENV === 'production'
            ? (statusCode === 500 ? 'Internal server error' : err.message)
            : err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

async function startServer() {
    try {
        // Try to connect to MongoDB, but allow server to start even if it fails
        try {
            const database = await connect();
            server.locals.db = database;
            server.use(`${process.env.BAI_API_BASE_VERSION}/db/mongo`, mongoRoutes);
        } catch (dbError) {
            console.error('MongoDB connection failed - starting without database');
            server.locals.db = null;
        }

        server.listen(process.env.BAI_API_PORT, () => {
            console.log(`Server started on port ${process.env.BAI_API_PORT}`);
        })

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log("SIGINT signal: closing HTTP and DB connections");
            if (server.locals.db) await disconnect();
            process.exit(0);
        })

        process.on('SIGTERM', async () => {
            console.log('SIGTERM signal received: closing HTTP and DB connections');
            if (server.locals.db) await disconnect();
            process.exit(0);
        })
    }
    catch (error) {
        console.log("Failed to start server", error);
        process.exit(1);
    }
}

startServer();