/**
 * middleware/errorHandler.js
 * ------------------------------------------------------------
 * Centralized Express error handler. Catches:
 *   - Malformed JSON bodies (thrown by express.json())
 *   - Database insert/update failures forwarded via next(err)
 *   - Any other unexpected/unhandled error
 *
 * Must be registered LAST, after all routes, in app.js.
 * ------------------------------------------------------------
 */

function errorHandler(err, req, res, next) {
  // express.json() throws a SyntaxError with a `body` flag on malformed JSON.
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    console.error('[ERROR] Invalid JSON payload:', err.message);
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  console.error('[ERROR] Unexpected error:', err.stack || err.message);
  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;
