var express 			= require('express');
var router 				= express.Router();
var path				= require('path');
var multer				= require('multer');
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var problemList 		= require('../helpers/upload-problem')

// Specify directory to store submissions.
// Rename submission files so that Themis can parse user's name and problem's name.
var storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, './data/problems');
	},
});

var upload = multer({ storage: storage }).single('file');

// Name: Upload problem.
// Type: POST.
router.post('/', [ensureAuthorized, upload], function(req, res) {
	// Get problem file's content and store it in database.
	var username = req.body.username;
	var problemName = req.file.originalname;
	var topic = req.body.topic;
	var filePath = path.join(process.cwd(), 'data/problems', req.file.filename);

	problemList.addProblem(username, problemName, topic, filePath)

	upload(req, res, function(err) {
		if (err) {
			res.status(400).send('FAILED');
			return;
		}
		res.send({ problemName: req.file.filename });
	});
});

module.exports = router;