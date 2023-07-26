const express = require('express');
const router = express.Router();
const { getPlaylist, getDummyData, searchSong } = require('../controllers/user');

router.get('/playlist/:type', getPlaylist);
router.post('/search', searchSong);
router.get('/dummy/:type', getDummyData);

module.exports = router;