var express 			= require('express');
var router 				= express.Router();
var path				= require('path');
var multer				= require('multer');
var ensureAdmin 		= require('../helpers/ensure-admin');
var Contests 			= require('../helpers/contests');
var dateTimeCvt			= require('../helpers/datetime-converter');

// Specify directory to store problem statements of contests.
var storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, './public/data/contests');
	},
	filename: function(req, file, cb) {
		var originalName = file.originalname;
		// console.log(req.body);
		cb(null, originalName);
	}
});

var upload = multer({ storage: storage }).single('file');

// Name: Create new contest.
// Type: POST.
// Data: setter, name, topic, file, startTime, endTime.
router.post('/create', [ensureAdmin, upload], function(req, res) {
	var newContest = {
		setter: req.body.setter,
		name: req.body.name,
		topic: req.body.topic,
		startTime: req.body.startTime,
		endTime: req.body.endTime,
		duration: dateTimeCvt.toDuration(req.body.startTime, req.body.endTime),	
		filePath: path.join('data/contests', req.file.filename)
	};
	Contests.addContest(newContest);

	upload(req, res, function(err) {
		if (err) {
			res.status(400).send('FAILED');
			return;
		}
		res.send({ problemName: req.file.filename });
	});
});

// Name: Get all contests.
// Type: GET.
router.get('/all', [], function(req, res) {
	Contests.getAllContests().then(function successCallback(contests){
		res.send({ contests: contests });
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

module.exports = router;