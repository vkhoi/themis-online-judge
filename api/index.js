// All api routes are defined here.

var express 	= require('express');
var router 		= express.Router();

router.use('/login', require('./login'));
router.use('/logout', require('./logout'));
router.use('/submit', require('./submit'));

module.exports = router;