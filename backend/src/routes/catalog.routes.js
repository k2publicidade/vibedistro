const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');

router.get('/releases', catalogController.getReleases);
router.get('/releases/:id', catalogController.getReleaseDetails);

module.exports = router;
