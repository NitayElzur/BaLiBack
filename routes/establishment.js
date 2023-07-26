const router = require('express').Router();
const { fetchAll, create, fetchSpecific, updateEstablishment } = require('../controllers/establishment')

router.get('/fetch-all', fetchAll);
router.post('/create', create);
router.post('/fetch-specific', fetchSpecific);
router.patch('/update', updateEstablishment);

module.exports = router