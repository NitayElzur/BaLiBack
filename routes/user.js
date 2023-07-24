const express = require('express');
const router = express.Router();
const { getPopularInIsrael } = require('../controllers/user');

router.get('/', getPopularInIsrael)

module.exports = router;