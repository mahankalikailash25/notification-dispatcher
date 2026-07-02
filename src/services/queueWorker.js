/**
 * services/queueWorker.js
 * ------------------------------------------------------------
 * The background worker that gives this system its "event-driven,
 * async" character. It runs independently of the HTTP request
 * lifecycle:
 *
 *   - Continuously polls the in-memory queue.
 *   - For each task, simulates sending a notification with a
 *     random delay (500-1000ms) and a 10% chance of failure.
 *   - Persists the outcome back to SQLite via notificationService.
 *
 * The worker is started once from server.js and keeps running for
 * the lifetime of the process.
 * ------------------------------------------------------------
 */

const notificationQueue = require('../queue/notificationQueue');
const notificationService = require('./notificationService');
const randomDelay = require('../utils/randomDelay');

const FAILURE_RATE = Number(process.env.FAILURE_RATE) || 0.1;

// How often (ms) the worker checks the queue when it's empty.
// Keeps the loop lightweight instead of a tight busy-wait.
const POLL_INTERVAL_MS = 200;

let isRunning = false;

/**
 * Processes a single notification task end-to-end:
 * simulate send -> random delay -> success/failure -> DB update.
 * @param {object} task
 */
async function processTask(task) {
  console.log(
    `[WORKER] Processing Notification -> notification_id=${task.notification_id}, ` +
      `recipient=${task.recipient}, channel=${task.channel}`
  );

  // Simulate the latency of calling a real notification provider.
  await randomDelay();

  // Simulate a 10% chance of failure, as required by the spec.
  const didFail = Math.random() < FAILURE_RATE;

  try {
    if (didFail) {
      await notificationService.markFailed(task.notification_id);
      console.log(
        `[WORKER] Notification Failed -> notification_id=${task.notification_id}`
      );
    } else {
      await notificationService.markCompleted(task.notification_id);
      console.log(
        `[WORKER] Notification Completed -> notification_id=${task.notification_id}`
      );
    }
  } catch (err) {
    // If even the DB update fails, log it loudly. In a production system
    // this is where you'd push to a dead-letter queue or alerting system.
    console.error(
      `[WORKER] Failed to persist status for notification_id=${task.notification_id}:`,
      err.message
    );
  }
}

/**
 * Main worker loop. Runs forever once started, pulling one task
 * at a time off the queue and processing it sequentially.
 *
 * (Sequential processing keeps the demo deterministic and easy to
 * reason about; see README "Future Improvements" for concurrency.)
 */
async function startWorker() {
  if (isRunning) {
    console.warn('[WORKER] Worker already running — ignoring duplicate start.');
    return;
  }
  isRunning = true;
  console.log('[WORKER] Background notification worker started');

  // Infinite loop, but non-blocking: awaits inside keep the event
  // loop free for incoming HTTP requests between tasks.
  while (isRunning) {
    if (notificationQueue.isEmpty()) {
      await sleep(POLL_INTERVAL_MS);
      continue;
    }

    const task = notificationQueue.dequeue();
    if (task) {
      await processTask(task);
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Allows graceful shutdown / testing.
 */
function stopWorker() {
  isRunning = false;
  console.log('[WORKER] Background notification worker stopped');
}

module.exports = {
  startWorker,
  stopWorker,
};
