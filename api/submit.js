var express 			= require('express');
var router 				= express.Router();
var fs 					= require('fs');
var path				= require('path');
var multer				= require('multer');
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var UserSubLog			= require('../helpers/user-submission-log');
var jury				= require('../helpers/jury');
var contest 			= require('../helpers/contest');

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

// Function to remove extension from submission's filename and append it
// into the beginning of the name. (Ex: 123-[khoi][SEGMENT].cpp -> 123-cpp-[khoi][SEGMENT]).
// This helps insert new submission into the database easier.
function beautifyFilename(filename) {
	var tokens = filename.split('.');
	var tripped = tokens[0];
	var ext = tokens[tokens.length - 1].toLowerCase();
	tokens = tripped.split('-');
	tokens.splice(1, 0, ext);
	var newFilename = tokens.join('-');
	return newFilename;
}

// Function to retrieve score for this username with this submission.
function retrieveScore(username, submissionName) {
	// Ask jury to retrieve the score.
	jury.retrieveResult(submissionName).then(function successCallback(res) {
		// Add score to database.
		UserSubLog.addScoreDetails(username, submissionName, res);
		contest.updateScore(username, beautifyFilename(submissionName).split('[').pop().slice(0, -1), res.score);
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
		res.send({ submissionName: beautifyFilename(req.file.filename) });
	});
});

module.exports = router;