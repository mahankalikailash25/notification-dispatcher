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

module.exports = {
  markCompleted,
  markFailed,
};
