/**
 * queue/notificationQueue.js
 * ------------------------------------------------------------
 * A minimal in-memory FIFO queue implemented with a native
 * JavaScript array. No Redis / RabbitMQ / Kafka / BullMQ.
 *
 * Each task pushed onto the queue looks like:
 *   {
 *     event_id,
 *     notification_id,
 *     recipient,
 *     channel,
 *     status
 *   }
 *
 * This module intentionally has no knowledge of the database or
 * HTTP layer — it is a pure, dependency-free data structure.
 * ------------------------------------------------------------
 */

class NotificationQueue {
  constructor() {
    this._items = [];
  }

  /**
   * Adds a notification task to the end of the queue.
   * @param {object} task
   */
  enqueue(task) {
    this._items.push(task);
    console.log(
      `[QUEUE] Notification Added -> notification_id=${task.notification_id}, event_id=${task.event_id}`
    );
  }

  /**
   * Removes and returns the task at the front of the queue.
   * Returns undefined if the queue is empty.
   */
  dequeue() {
    return this._items.shift();
  }

  /**
   * True when there is nothing left to process.
   */
  isEmpty() {
    return this._items.length === 0;
  }

  /**
   * Current number of pending tasks — useful for logging/health checks.
   */
  size() {
    return this._items.length;
  }
}

// Exported as a singleton so the whole app shares one queue instance.
module.exports = new NotificationQueue();
