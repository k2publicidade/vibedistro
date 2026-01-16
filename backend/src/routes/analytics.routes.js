const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/trends/daily', analyticsController.getDailyTrends);

module.exports = router;
