const express = require('express');
const router = express.Router();
const { getPlaylist, getDummyData } = require('../controllers/user');

router.get('/playlist/:type', getPlaylist);
router.get('/dummy', getDummyData);

module.exports = router;