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

module.exports = router;
