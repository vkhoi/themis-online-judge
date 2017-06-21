const express 		= require('express');
const router 		= express.Router();
const path			= require('path');
const multer		= require('multer');
const ensureAdmin 	= require('../helpers/ensure-admin');
const Contests 		= require('../helpers/contests');
const dateTimeCvt	= require('../helpers/datetime-converter');
const testDir 		= 'data/contests/tests';

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
	let newContest = {
		setter: req.body.setter,
		name: req.body.name,
		topic: req.body.topic,
		startTime: req.body.startTime,
		endTime: req.body.endTime,
		duration: dateTimeCvt.toDuration(req.body.startTime, req.body.endTime),	
		filePath: path.join('data/contests', req.file.filename),
		problemNames: req.body.problemNames
	};
	
	let id = null;
	Contests.addContest(newContest).then(function successCallback(contestId) {
		id = contestId;

		Contests.scheduleContestStart(req.body.startTime, contestId);
		Contests.scheduleContestEnd(req.body.endTime, contestId);

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
		let originalName = file.originalname;
		cb(null, Date.now() + '-' + originalName);
	}
});
var uploadTest = multer({ storage: storageTest }).single('file');

// Name: Upload test data to contest.
// Type: POST.
// Data: id of contest.
router.post('/addTest', [ensureAdmin, uploadTest], function(req, res) {
	let id = req.body.id;
	let fileTestName = req.file.filename;
	let originalName = req.file.originalname;
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