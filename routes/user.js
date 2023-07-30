const express = require('express');
const router = express.Router();
const { getPlaylist, getDummyData, searchSong, sendSong, createNewUser } = require('../controllers/user');

router.get('/new-user', createNewUser);
router.get('/playlist/:type', getPlaylist);
router.post('/search', searchSong);
router.get('/dummy/:type', getDummyData);
router.patch('/send', sendSong);

module.exports = router;