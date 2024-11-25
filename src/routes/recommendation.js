const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendation/recommendation');

router.post('/', recommendationController.getRecommendation);

module.exports = router;
