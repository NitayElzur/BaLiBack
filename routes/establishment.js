const router = require('express').Router();
const { fetchAll, create, fetchSpecific, updateEstablishment, acceptSong, getRequested, getAccepted, removeRequest, removeAccept, adminSendSong, getSongsFromPlaylist, pushToPlayed, changeAccepted, getEstabBest, changeRequested } = require('../controllers/establishment')

router.get('/fetch-all', fetchAll);
router.post('/create', create);
router.post('/fetch-specific', fetchSpecific);
router.patch('/update', updateEstablishment);
router.post('/requested', getRequested);
router.patch('/accept', acceptSong);
router.post('/accepted', getAccepted);
router.patch('/removeRequest', removeRequest);
router.patch('/removeAccept', removeAccept);
router.patch('/change-accepted', changeAccepted);
router.post('/getEstabBest', getEstabBest);
router.post('/change-requested', changeRequested);
router.post('/get-songs-from-playlist', getSongsFromPlaylist);
router.post('/push-to-played', pushToPlayed);
router.post('/admin-send-song', adminSendSong);

module.exports = router