const router = require('express').Router();
// const songController = require() //will be controller

router.get('/',(req, res) => {
    res.send('yep')
});

module.exports = router;