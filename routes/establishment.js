const router = require('express').Router();
const { fetchAll, create, fetchSpecific, updateEstablishment, acceptSong, getRequested, getAccepted, removeRequest, removeAccept, changeAccepted, getEstabBest, changeRequested } = require('../controllers/establishment')

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

module.exports = router