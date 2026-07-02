-- ============================================================
-- Schema for the Event-Driven Notification Dispatcher
-- ============================================================

-- Stores every incoming business event exactly as received.
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Stores a notification derived from an event. Each event currently
-- produces exactly one notification, but the schema allows an event
-- to fan out to multiple notifications in the future (e.g. email + sms).
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  recipient TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending','completed','failed')),
  retry_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(event_id) REFERENCES events(id)
);
