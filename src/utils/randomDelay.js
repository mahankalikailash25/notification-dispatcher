/**
 * utils/randomDelay.js
 * ------------------------------------------------------------
 * Small helper used by the worker to simulate the variable
 * latency of a real notification provider (email/SMS gateway).
 * ------------------------------------------------------------
 */

const MIN_DELAY_MS = Number(process.env.MIN_DELAY_MS) || 500;
const MAX_DELAY_MS = Number(process.env.MAX_DELAY_MS) || 1000;

/**
 * Resolves after a random delay between MIN_DELAY_MS and MAX_DELAY_MS.
 * @returns {Promise<void>}
 */
function randomDelay() {
  const delayMs =
    Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;

  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

module.exports = randomDelay;
