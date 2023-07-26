const express = require('express');
const router = express.Router();
const { getPlaylist, getDummyData, searchSong, sendSong, acceptSong, getRequested } = require('../controllers/user');

router.get('/playlist/:type', getPlaylist);
router.post('/search', searchSong);
router.get('/dummy/:type', getDummyData);
router.patch('/send', sendSong);
router.post('/requested', getRequested);
router.patch('/accept', acceptSong);
// router.post('/accepted', getAccepted)

module.exports = router;