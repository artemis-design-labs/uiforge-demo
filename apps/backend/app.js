import express from 'express';
import 'dotenv/config'
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';

// Import modules
import authRoutes from './routes/auth.js';
import { connect } from './routes/db/mongo/mongoose.js';
import mongoRoutes from './routes/db/mongo/apis.js';
import figmaRoutes from './routes/figma.js';
import errorLogsRoutes from './routes/errorLogs.js';
import activityRoutes from './routes/activity.js';
import userRoutes from './routes/user.js';
import codegenRoutes from './routes/codegen.js';
import { errorLoggingMiddleware } from './routes/utils/errorLogger.js';

// Initialize Express App
const app = express();

// Trust proxy for Railway/Vercel (needed for rate limiting and getting real client IP)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
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
app.use(compression({
    level: 6,
    threshold: 1024,
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
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 100 : 1000,  // Temporarily increased for testing
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !isProduction
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 100 : 10000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !isProduction
});

app.use(express.json({ limit: '10mb' }));
app.use(generalLimiter);

// Configure CORS
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.BAI_API_URL + ':' + process.env.BAI_UI_PORT,
            'http://localhost:3000',
            'https://localhost:3000',
            process.env.FRONTEND_URL
        ].filter(Boolean);

        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    maxAge: 86400
}
app.use(cors(corsOptions));

// Configure Cookies
app.use(cookieParser())

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API base version
const apiBase = process.env.BAI_API_BASE_VERSION || '/api/v1';

// Routes
app.use(`${apiBase}/auth`, authLimiter, authRoutes);
app.use(`${apiBase}/figma`, figmaRoutes);
app.use(`${apiBase}/errors`, errorLogsRoutes);
app.use(`${apiBase}/activity`, activityRoutes);
app.use(`${apiBase}/user`, userRoutes);
app.use(`${apiBase}/codegen`, codegenRoutes);

// MongoDB routes (added after connection)
let dbInitialized = false;

export async function initializeDatabase() {
    if (dbInitialized) return;

    try {
        const database = await connect();
        app.locals.db = database;
        app.use(`${apiBase}/db/mongo`, mongoRoutes);
        dbInitialized = true;
        console.log('Database initialized');
    } catch (dbError) {
        console.error('MongoDB connection failed:', dbError.message);
        app.locals.db = null;
    }
}

// Error logging middleware
app.use(errorLoggingMiddleware);

// Global error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    if (process.env.NODE_ENV === 'production') {
        console.error(`[${new Date().toISOString()}] ${statusCode} - ${err.message}`);
    } else {
        console.error('Unhandled error:', err);
    }

    res.status(statusCode).json({
        error: process.env.NODE_ENV === 'production'
            ? (statusCode === 500 ? 'Internal server error' : err.message)
            : err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

export default app;
