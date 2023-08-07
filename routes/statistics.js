const router = require('express').Router();
const { getPlaylist } = require('../controllers/statistics')

router.post('/getPlaylist', getPlaylist)

module.exports = router;