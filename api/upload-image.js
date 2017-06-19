var express 			= require('express');
var router 				= express.Router();
var path				= require('path');
var multer				= require('multer');
var ensureAuthorized 	= require('../helpers/ensure-authorized');

// Specify directory to store images.
var storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, './public/data/images');
	},
	filename: function(req, file, cb) {
		var originalName = file.originalname;
		cb(null, Date.now() + '-' + originalName);
	}
});

var upload = multer({ storage: storage }).single('file');

// Name: Upload problem.
// Type: POST.
router.post('/', [ensureAuthorized, upload], function(req, res) {
	upload(req, res, function(err) {
		if (err) {
			res.status(500).send('FAILED');
			return;
		}
		res.send({ imageName: req.file.filename });
	});
});

module.exports = router;