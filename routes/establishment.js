const router = require('express').Router();
const { fetchAll, create, fetchSpecific, updateEstablishment, acceptSong, getRequested, getAccepted, removeRequest, removeAccept } = require('../controllers/establishment')

router.get('/fetch-all', fetchAll);
router.post('/create', create);
router.post('/fetch-specific', fetchSpecific);
router.patch('/update', updateEstablishment);
router.post('/requested', getRequested);
router.patch('/accept', acceptSong);
router.post('/accepted', getAccepted);
router.patch('/removeRequest', removeRequest);
router.patch('/removeAccept', removeAccept);

module.exports = router