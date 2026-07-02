/**
 * services/notificationService.js
 * ------------------------------------------------------------
 * Owns all writes to the `notifications` table AFTER the
 * initial row has been created. Specifically:
 *   - marking a notification completed
 *   - marking a notification failed (and bumping retry_count)
 *
 * The queueWorker calls into this service; it never touches
 * SQL directly.
 * ------------------------------------------------------------
 */

const db = require('../db/database');

/**
 * Marks a notification as completed.
 * @param {number} notificationId
 */
async function markCompleted(notificationId) {
  await db.run(
    `UPDATE notifications
     SET status = 'completed', updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [notificationId]
  );
}

/**
 * Marks a notification as failed and increments its retry_count.
 * @param {number} notificationId
 */
async function markFailed(notificationId) {
  await db.run(
    `UPDATE notifications
     SET status = 'failed',
         retry_count = retry_count + 1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [notificationId]
  );
}

/**
 * Fetches a single notification by id. Returns undefined if not found.
 * @param {number} notificationId
 */
async function getNotificationById(notificationId) {
  return db.get(`SELECT * FROM notifications WHERE id = ?`, [notificationId]);
}

/**
 * Fetches notifications, optionally filtered by status, most recent
 * first, with basic pagination.
 *
 * @param {object} options
 * @param {string} [options.status] - filter by 'pending' | 'completed' | 'failed'
 * @param {number} [options.limit]
 * @param {number} [options.offset]
 */
async function getAllNotifications({ status, limit = 50, offset = 0 } = {}) {
  if (status) {
    return db.all(
      `SELECT * FROM notifications WHERE status = ? ORDER BY id DESC LIMIT ? OFFSET ?`,
      [status, limit, offset]
    );
  }
  return db.all(
    `SELECT * FROM notifications ORDER BY id DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
}

module.exports = {
  markCompleted,
  markFailed,
  getNotificationById,
  getAllNotifications,
};
