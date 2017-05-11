var express 			= require('express');
var router 				= express.Router();
var fs 					= require('fs');
var path				= require('path');
var multer				= require('multer');
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var UserSubLog			= require('../models/user-submission-log');

// Specify directory to store submissions.
// Rename submission files so that Themis can parse user's name and problem's name.
var storage = multer.diskStorage({
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

var upload = multer({ storage: storage }).single('file');

// Name: Upload code.
// Type: POST.
router.post('/', [ensureAuthorized, upload], function(req, res) {
	var username = req.body.username;
	var filePath = path.join(process.cwd(), 'uploads', req.file.filename);
	var fileContent = null;
	fs.readFile(filePath, 'utf8', function(err, data) {
		if (err) {
			return;
		}
		fileContent = data;
		UserSubLog.addSubmission(username, req.file.filename, fileContent);
	});

	upload(req, res, function(err) {
		if (err) {
			res.status(400).send('FAILED');
			return;
		}
		res.send('SUCCESS');
	});
});

module.exports = router;