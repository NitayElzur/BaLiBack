const router = require('express').Router();
const { fetchAll, create } = require('../controllers/establishment')

router.get('/fetch-all', fetchAll);
router.post('/create', create);

module.exports = router