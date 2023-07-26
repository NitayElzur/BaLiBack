const router = require('express').Router();
const { createSong, updateByKeys } = require('../controllers/song')

router.post('/create', createSong);
router.patch('/update-by-keys', updateByKeys);

module.exports = router;