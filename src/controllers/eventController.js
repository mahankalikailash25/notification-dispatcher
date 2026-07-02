/**
 * controllers/eventController.js
 * ------------------------------------------------------------
 * HTTP boundary layer. Responsibilities:
 *   - Validate the incoming request body
 *   - Delegate the actual work to eventService
 *   - Shape and send the HTTP response
 *
 * No SQL and no queue logic lives here — that all belongs to
 * the service layer. Errors are forwarded to the centralized
 * error-handling middleware via next(err).
 * ------------------------------------------------------------
 */

const eventService = require('../services/eventService');

/**
 * POST /api/v1/events
 */
async function createEvent(req, res, next) {
  try {
    const { event_type, recipient, data } = req.body || {};

    // --- Validation ---------------------------------------------------
    if (!event_type || !recipient) {
      return res.status(400).json({
        error: 'event_type and recipient are required',
      });
    }

    // --- Delegate to service layer -------------------------------------
    const { eventId, notificationId } = await eventService.createEventAndNotification({
      eventType: event_type,
      recipient,
      data,
    });

    // --- Respond immediately, do NOT wait for background processing ----
    return res.status(202).json({
      message: 'Event accepted for processing',
      tracking_id: eventId,
      notification_id: notificationId,
      status: 'pending',
    });
  } catch (err) {
    // Delegate to centralized error handler middleware.
    next(err);
  }
}

module.exports = {
  createEvent,
};
