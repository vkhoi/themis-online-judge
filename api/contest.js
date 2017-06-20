var express 			= require('express');
var router 				= express.Router();
var path				= require('path');
var multer				= require('multer');
var ensureAdmin 		= require('../helpers/ensure-admin');
var Contests 			= require('../helpers/contests');
var dateTimeCvt			= require('../helpers/datetime-converter');

var testDir 			= 'data/contests/tests';

// Specify directory to store problem statements of contests.
var storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, './public/data/contests');
	},
	filename: function(req, file, cb) {
		var originalName = file.originalname;
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
	var id = null;
	Contests.addContest(newContest).then(function successCallback(contestId) {
		id = contestId;

		upload(req, res, function(err) {
			if (err) {
				res.status(400).send('FAILED');
				return;
			}
			res.send({ status: 'SUCCESS', id: id });
		});
	});
});

// Specify directory to store test data of contest.
var storageTest = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, testDir);
	},
	filename: function(req, file, cb) {
		var originalName = file.originalname;
		cb(null, Date.now() + '-' + originalName);
	}
});
var uploadTest = multer({ storage: storageTest }).single('file');

// Name: Upload test data to contest.
// Type: POST.
// Data: id of contest.
router.post('/addTest', [ensureAdmin, uploadTest], function(req, res) {
	var id = req.body.id;
	var fileTestName = req.file.filename;
	var originalName = req.file.originalname;
	Contests.getContest(id).then(function successCallback(contest) {
		Contests.uncompressFileTest(fileTestName).then(function successCallback() {
			Contests.removeThemisTestFolder().then(function successCallback() {
				Contests.moveTestFolders(originalName).then(function successCallback() {
					uploadTest(req, res, function(err) {
						if (err) {
							res.status(400).send('FAILED');
							return;
						}
						res.send({ status: 'SUCCESS' });
					});
				}, function errorCallback(err) {
					res.status(500).send();
				});
			}, function errorCallback(err) {
				res.status(500).send();
			});
		}, function errorCallback(err) {
			res.status(500).send();
		});
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