const router = require('express').Router();
const { getPlaylist, conversionRate } = require('../controllers/statistics')

router.post('/getPlaylist', getPlaylist)
router.post('/conversionRate', conversionRate)

module.exports = router;