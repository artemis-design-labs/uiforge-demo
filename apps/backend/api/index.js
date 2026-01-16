import app, { initializeDatabase } from '../app.js';

// Initialize database on cold start
let isInitialized = false;

export default async function handler(req, res) {
    // Initialize database once per cold start
    if (!isInitialized) {
        await initializeDatabase();
        isInitialized = true;
    }

    // Let Express handle the request
    return app(req, res);
}
