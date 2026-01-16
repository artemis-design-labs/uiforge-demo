import app, { initializeDatabase } from './app.js';
import { disconnect } from './routes/db/mongo/mongoose.js';

async function startServer() {
    try {
        // Initialize database connection
        await initializeDatabase();

        // Railway/Vercel provides PORT, fallback to BAI_API_PORT for local dev
        const port = process.env.PORT || process.env.BAI_API_PORT || 3001;

        const server = app.listen(port, () => {
            console.log(`Server started on port ${port}`);
        });

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log("SIGINT signal: closing HTTP and DB connections");
            server.close();
            await disconnect();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('SIGTERM signal received: closing HTTP and DB connections');
            server.close();
            await disconnect();
            process.exit(0);
        });
    } catch (error) {
        console.log("Failed to start server", error);
        process.exit(1);
    }
}

startServer();
