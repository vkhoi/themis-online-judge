var express 			= require('express');
var router 				= express.Router();
var fs 					= require('fs');
var path				= require('path');
var multer				= require('multer');
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var UserSubLog			= require('../models/user-submission-log');
var jury				= require('../helpers/jury');

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
		var ext = originalName.split('.').pop().toLowerCase();;
		var newname = '[' + username + '][' + problem + '].' + ext;
		cb(null, Date.now() + '-' + newname);
	}
});

var upload = multer({ storage: storage }).single('file');

// Function to retrieve score for this username with this submission.
function retrieveScore(username, submissionName) {
	// Ask jury to retrieve the score.
	jury.retrieveScore(submissionName).then(function successCallback(score) {
		// Add score to database.
		UserSubLog.addScore(username, submissionName, score);
	}, function errorCallback(err) {
		// Themis has not done grading, so ask jury to retrieve the score after 5 seconds.
		setTimeout(function() {
			retrieveScore(username, submissionName);
		}, 5000);
	});
}

// Name: Upload code.
// Type: POST.
router.post('/', [ensureAuthorized, upload], function(req, res) {
	// Get submission file's content and store it in database.
	// Themis is programmed to delete source code after grading so this is one way
	// to store the source code of contestants.
	var username = req.body.username;
	var filePath = path.join(process.cwd(), 'uploads', req.file.filename);
	fs.readFile(filePath, 'utf8', function(err, fileContent) {
		if (err) {
			return;
		}
		// Insert source code into user's submission log.
		UserSubLog.addSubmission(username, req.file.filename, fileContent);

		// Ask jury to retrieve score from Themis.
		retrieveScore(username, req.file.filename);
	});

	upload(req, res, function(err) {
		if (err) {
			res.status(400).send('FAILED');
			return;
		}
		res.send({ submissionName: req.file.filename });
	});
});

module.exports = router;