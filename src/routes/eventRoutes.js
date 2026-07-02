/**
 * routes/eventRoutes.js
 * ------------------------------------------------------------
 * Pure route wiring — no logic here, just mapping HTTP verbs
 * and paths to controller functions.
 * ------------------------------------------------------------
 */

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// POST /api/v1/events
router.post('/events', eventController.createEvent);

// GET /api/v1/events           -> list events (with notifications)
// GET /api/v1/events/:id       -> a single event (with notifications)
router.get('/events', eventController.listEvents);
router.get('/events/:id', eventController.getEvent);

// GET /api/v1/notifications          -> list notifications (optionally ?status=)
// GET /api/v1/notifications/:id      -> a single notification's status
router.get('/notifications', eventController.listNotifications);
router.get('/notifications/:id', eventController.getNotification);

module.exports = router;
