/**
 * db/database.js
 * ------------------------------------------------------------
 * Responsible ONLY for:
 *   - Opening the SQLite connection
 *   - Running the schema (creating tables if they don't exist)
 *   - Exposing small, reusable, promisified query helpers
 *     (run / get / all) that the rest of the app builds on.
 *
 * No business logic lives here — services call these helpers.
 * ------------------------------------------------------------
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './data/dispatcher.db';
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Make sure the folder that will hold the .db file actually exists.
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// A single shared connection is enough for this lightweight app.
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('[DATABASE] Failed to connect:', err.message);
    process.exit(1);
  }
  console.log(`[DATABASE] Connected to SQLite at ${DB_PATH}`);
});

// Enforce foreign key constraints (off by default in SQLite).
db.run('PRAGMA foreign_keys = ON');

/**
 * Runs the schema.sql file to create tables if they do not exist yet.
 * Safe to call every time the server starts (CREATE TABLE IF NOT EXISTS).
 */
function initSchema() {
  return new Promise((resolve, reject) => {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schema, (err) => {
      if (err) {
        console.error('[DATABASE] Failed to initialize schema:', err.message);
        return reject(err);
      }
      console.log('[DATABASE] Schema ready (events, notifications)');
      resolve();
    });
  });
}

/**
 * Promisified INSERT/UPDATE/DELETE.
 * Resolves with { lastID, changes } so callers can read the new row id.
 */
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

/**
 * Promisified single-row SELECT.
 */
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

/**
 * Promisified multi-row SELECT.
 */
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

module.exports = {
  db,
  initSchema,
  run,
  get,
  all,
};
