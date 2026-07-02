/**
 * app.js
 * ------------------------------------------------------------
 * Configures the Express application: global middleware, route
 * mounting, and the centralized error handler. Exported (not
 * started) so it can be required by server.js and, if ever
 * needed, by tests.
 * ------------------------------------------------------------
 */

const express = require('express');
const eventRoutes = require('./routes/eventRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Parse JSON bodies. Malformed JSON is caught here and forwarded
// to errorHandler as a SyntaxError.
app.use(express.json());

// Simple request logger.
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check — handy for confirming the server is alive.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API routes.
app.use('/api/v1', eventRoutes);

// 404 handler for unmatched routes.
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler — must be registered last.
app.use(errorHandler);

module.exports = app;
