/**
 * server.js
 * ------------------------------------------------------------
 * Application entry point. Responsible for:
 *   1. Loading environment variables
 *   2. Initializing the SQLite schema
 *   3. Starting the background queue worker
 *   4. Starting the Express HTTP server
 *
 * Run with: npm start  (or npm run dev for nodemon)
 * ------------------------------------------------------------
 */

require('dotenv').config();

const app = require('./app');
const db = require('./db/database');
const { startWorker } = require('./services/queueWorker');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    // 1. Make sure tables exist before accepting any traffic.
    await db.initSchema();

    // 2. Start the background worker. It runs independently for the
    //    lifetime of the process, continuously draining the queue.
    startWorker();

    // 3. Start listening for HTTP requests.
    app.listen(PORT, () => {
      console.log(`[SERVER] Started on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[SERVER] Failed to start:', err.message);
    process.exit(1);
  }
}

bootstrap();
