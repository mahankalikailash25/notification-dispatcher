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
const notificationService = require('../services/notificationService');

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

/**
 * GET /api/v1/events/:id
 * Returns a single event and all notifications created for it.
 */
async function getEvent(req, res, next) {
  try {
    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ error: 'id must be a positive integer' });
    }

    const event = await eventService.getEventById(eventId);

    if (!event) {
      return res.status(404).json({ error: `Event ${eventId} not found` });
    }

    return res.status(200).json(event);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/events
 * Returns a paginated list of events, most recent first, each
 * with its associated notifications attached.
 * Query params: ?limit=&offset=
 */
async function listEvents(req, res, next) {
  try {
    const { limit, offset } = parsePagination(req.query);

    const events = await eventService.getAllEvents({ limit, offset });

    return res.status(200).json({
      count: events.length,
      limit,
      offset,
      events,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/notifications/:id
 * Returns a single notification's current status.
 */
async function getNotification(req, res, next) {
  try {
    const notificationId = Number(req.params.id);

    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return res.status(400).json({ error: 'id must be a positive integer' });
    }

    const notification = await notificationService.getNotificationById(notificationId);

    if (!notification) {
      return res.status(404).json({ error: `Notification ${notificationId} not found` });
    }

    return res.status(200).json(notification);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/notifications
 * Returns a paginated list of notifications, most recent first.
 * Query params: ?status=pending|completed|failed&limit=&offset=
 */
async function listNotifications(req, res, next) {
  try {
    const { status } = req.query;
    const validStatuses = ['pending', 'completed', 'failed'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const { limit, offset } = parsePagination(req.query);

    const notifications = await notificationService.getAllNotifications({
      status,
      limit,
      offset,
    });

    return res.status(200).json({
      count: notifications.length,
      limit,
      offset,
      notifications,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Parses and sanitizes limit/offset query params with sane defaults
 * and bounds, so a malformed or huge value can't be used to abuse
 * the database layer.
 */
function parsePagination(query) {
  let limit = Number(query.limit);
  let offset = Number(query.offset);

  if (!Number.isInteger(limit) || limit <= 0) limit = 50;
  if (limit > 200) limit = 200;

  if (!Number.isInteger(offset) || offset < 0) offset = 0;

  return { limit, offset };
}

module.exports = {
  createEvent,
  getEvent,
  listEvents,
  getNotification,
  listNotifications,
};
