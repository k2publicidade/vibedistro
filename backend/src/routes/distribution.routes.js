const express = require('express');
const router = express.Router();
const distributionController = require('../controllers/distributionController');

router.post('/deliver', distributionController.distributeRelease);

module.exports = router;
