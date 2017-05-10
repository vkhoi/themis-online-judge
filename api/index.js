// All api routes are defined here.

var express 	= require('express');
var router 		= express.Router();
var path 		= require('path');
var DataStore 	= require('nedb'),
	UserSubLog	= new DataStore({ filename: path.join(process.cwd(), 'data', 'user-sub-log.db'), 							autoload: true });

router.use('/login', require('./login'));
router.use('/logout', require('./logout'));
router.use('/submit', require('./submit'));

module.exports = router;