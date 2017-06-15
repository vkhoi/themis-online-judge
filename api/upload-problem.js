var express 			= require('express');
var router 				= express.Router();
var path				= require('path');
var multer				= require('multer');
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var problemList 		= require('../helpers/upload-problem');
var dateTimeCvt			= require('../helpers/datetime-converter');

// Specify directory to store submissions.
// Rename submission files so that Themis can parse user's name and problem's name.
var storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, './public/data/problems');
	},
});

var upload = multer({ storage: storage }).single('file');

// Name: Upload problem.
// Type: POST.
router.post('/', [ensureAuthorized, upload], function(req, res) {
	// Get problem file's content and store it in database.
	var newProblem = {
		problemName: req.file.originalname,
		uploadUser: req.body.uploadUser,
		topic: req.body.topic,
		filePath: path.join('data/problems', req.file.filename),
		startTime: req.body.startTime,
		endTime: req.body.endTime,
		duration: dateTimeCvt.toDuration(req.body.startTime, req.body.endTime)
	};
	problemList.addProblem(newProblem);

	upload(req, res, function(err) {
		if (err) {
			res.status(400).send('FAILED');
			return;
		}
		res.send({ problemName: req.file.filename });
	});
});

module.exports = router;