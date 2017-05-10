// All api routes are defined here.

var express 	= require('express');
var router 		= express.Router();
var fs			= require('fs');
var path 		= require('path');
var readline 	= require('readline');
var redis		= require('redis');
var multer		= require('multer');
var DataStore 	= require('nedb'),
	UserSubLog	= new DataStore({ filename: path.join(process.cwd(), 'data', 'user-sub-log.db'), 							autoload: true });
var redisClient = redis.createClient();

var storage 	= multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, './uploads');
	},
	filename: function(req, file, cb) {
		var username = req.body.username;
		var problem = req.body.problem;
		var originalName = file.originalname;
		var ext = originalName.split('.').pop();
		var newname = '[' + username + '][' + problem + '].' + ext;
		cb(null, Date.now() + '-' + newname);
	}
});

var upload		= multer({ storage: storage }).single('file');

var ensureAuthorized = require('./helpers/ensureAuthorized');

router.use('/login', require('./api/login'));

// Name: Log out.
// Type: POST.
// Data: token.
router.post('/logout', function(req, res) {
	var token = req.body.token;

	redisClient.del(token, function(err, reply) {
		res.json({ status: 'SUCCESS' });
	});
});

// Name: Upload code.
// Type: POST.
router.post('/upload', [ensureAuthorized, upload], function(req, res) {
	upload(req, res, function(err) {
		if (err) {
			res.status(400).send('FAILED');
			return;
		}
		res.send('SUCCESS');
	});
});

module.exports = router;