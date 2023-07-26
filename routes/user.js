const express = require('express');
const router = express.Router();
const { getPlaylist, getDummyData, searchSong, sendSong, acceptSong } = require('../controllers/user');

router.get('/playlist/:type', getPlaylist);
router.post('/search', searchSong);
router.get('/dummy/:type', getDummyData);
router.patch('/send', sendSong);
router.patch('/accept', acceptSong)

module.exports = router;