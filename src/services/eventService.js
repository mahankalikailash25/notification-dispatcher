/**
 * services/eventService.js
 * ------------------------------------------------------------
 * Handles everything that must happen the moment an event
 * arrives, BEFORE the HTTP response is sent:
 *   1. Persist the raw event
 *   2. Create a `pending` notification tied to that event
 *   3. Push a lightweight task onto the in-memory queue
 *
 * This service does not send the actual notification — that is
 * the background worker's job. It only prepares state and
 * returns quickly so the controller can respond with 202.
 * ------------------------------------------------------------
 */

const db = require('../db/database');
const notificationQueue = require('../queue/notificationQueue');

const DEFAULT_CHANNEL = 'email';

/**
 * Persists the event, creates its notification record, and
 * enqueues the notification for background processing.
 *
 * @param {object} params
 * @param {string} params.eventType
 * @param {string} params.recipient
 * @param {object} params.data - arbitrary event payload
 * @returns {Promise<{ eventId: number, notificationId: number }>}
 */
async function createEventAndNotification({ eventType, recipient, data }) {
  // 1. Save the event. We store the full payload (including recipient)
  //    as JSON so the raw event is always reproducible/auditable.
  const payload = JSON.stringify({ recipient, data: data || {} });

  const eventResult = await db.run(
    `INSERT INTO events (event_type, payload) VALUES (?, ?)`,
    [eventType, payload]
  );
  const eventId = eventResult.lastID;

  // 2. Create the notification in `pending` status.
  const notificationResult = await db.run(
    `INSERT INTO notifications (event_id, recipient, channel, status)
     VALUES (?, ?, ?, 'pending')`,
    [eventId, recipient, DEFAULT_CHANNEL]
  );
  const notificationId = notificationResult.lastID;

  // 3. Push onto the in-memory queue for the background worker to pick up.
  notificationQueue.enqueue({
    event_id: eventId,
    notification_id: notificationId,
    recipient,
    channel: DEFAULT_CHANNEL,
    status: 'pending',
  });

  return { eventId, notificationId };
}

/**
 * Fetches a single event by id, along with all notifications
 * created for it. Returns null if the event doesn't exist.
 *
 * @param {number} eventId
 * @returns {Promise<object|null>}
 */
async function getEventById(eventId) {
  const event = await db.get(`SELECT * FROM events WHERE id = ?`, [eventId]);
  if (!event) return null;

  const notifications = await db.all(
    `SELECT * FROM notifications WHERE event_id = ? ORDER BY id ASC`,
    [eventId]
  );

  return {
    ...event,
    payload: safeParseJSON(event.payload),
    notifications,
  };
}

/**
 * Fetches every event, each with its notifications attached,
 * most recent first. Supports basic pagination via limit/offset.
 *
 * @param {object} options
 * @param {number} options.limit
 * @param {number} options.offset
 * @returns {Promise<object[]>}
 */
async function getAllEvents({ limit = 50, offset = 0 } = {}) {
  const events = await db.all(
    `SELECT * FROM events ORDER BY id DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  if (events.length === 0) return [];

  // Fetch notifications for all returned events in one query.
  const eventIds = events.map((e) => e.id);
  const placeholders = eventIds.map(() => '?').join(',');
  const notifications = await db.all(
    `SELECT * FROM notifications WHERE event_id IN (${placeholders}) ORDER BY id ASC`,
    eventIds
  );

  return events.map((event) => ({
    ...event,
    payload: safeParseJSON(event.payload),
    notifications: notifications.filter((n) => n.event_id === event.id),
  }));
}

/**
 * Parses the JSON payload stored on an event; falls back to the
 * raw string if it's somehow not valid JSON, so a bad row never
 * crashes a read request.
 */
function safeParseJSON(value) {
  try {
    return JSON.parse(value);
  } catch (err) {
    return value;
  }
}

module.exports = {
  createEventAndNotification,
  getEventById,
  getAllEvents,
};
