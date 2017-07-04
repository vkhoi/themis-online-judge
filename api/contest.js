const express 			= require('express');
const router 			= express.Router();
const path				= require('path');
const multer			= require('multer');
const ensureAdmin 		= require('../helpers/ensure-admin');
const ensureAuthorized 	= require('../helpers/ensure-authorized');
const Contests 			= require('../helpers/contests');
const dateTimeCvt		= require('../helpers/datetime-converter');
const testDir 			= 'data/contests/tests';
const moment 			= require('moment');

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
		problems: req.body.problems
	};
	for (let i = 0; i < newContest.problems.length; i += 1) {
		if ("$hashKey" in newContest.problems[i]) {
			delete newContest.problems[i].$hashKey;
		}
	}
	newContest.problems.forEach(function(problem) {
		problem.testScore = parseInt(problem.testScore);
		problem.timeLimit = parseInt(problem.timeLimit);
		problem.memoryLimit = parseInt(problem.memoryLimit);
	});

	// if (moment(newContest.endTime, "HH:mm, DD/MM/YYYY")-moment(newContest.startTime, "HH:mm, DD/MM/YYYY") < 300000) {
	// 	res.send({ status: 'FAILED', message: 'Kì thi phải kéo dài ít nhất 5 phút' });
	// }
	if (moment(newContest.startTime, "HH:mm, DD/MM/YYYY") - moment() < 180000) {
		res.send({ status: 'FAILED', message: 'Thời gian bắt đầu phải cách thời điểm hiện tại ít nhất 3 phút (vì lí do hệ thống cần xử lí file test sau khi được upload lên)' });
	}
	else {
		Contests.addContest(newContest).then(function successCallback(contestId) {
			Contests.scheduleContestStart(req.body.startTime, contestId);
			Contests.scheduleContestEnd(req.body.endTime, contestId);

			upload(req, res, function(err) {
				if (err) {
					res.status(400).send('FAILED');
					return;
				}
				res.send({ status: 'SUCCESS', id: contestId });
			});
		}, function errorCallback(err) {
			res.send({ status: 'FAILED', message: err.toString() });
		});
	}
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
	let fileTestName = req.file.filename;
	let originalName = req.file.originalname;

	Contests.canAddNewContest().then(function successCallback() {
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
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
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

// Name: Get pending contest.
// Type: GET.
router.get('/pendingContest', [ensureAdmin], function(req, res) {
	Contests.getPendingContest().then(function successCallback(contest) {
		res.send({ contest: contest });
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

// Name: Edit contest's info.
// Type: POST.
router.post('/edit', [ensureAdmin], function(req, res) {
	let contest = {
		id: req.body.id,
		name: req.body.name,
		topic: req.body.topic,
		startTime: req.body.startTime,
		endTime: req.body.endTime,
		duration: dateTimeCvt.toDuration(req.body.startTime, req.body.endTime),	
		problems: req.body.problems
	};
	contest.problems.forEach(function(problem) {
		problem.testScore = parseInt(problem.testScore);
		problem.timeLimit = parseInt(problem.timeLimit);
		problem.memoryLimit = parseInt(problem.memoryLimit);
	});

	Contests.editContest(contest).then(function successCallback(result) {
		res.send({ status: "SUCCESS "});
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

// Name: Edit problem file.
// Type: POST.
router.post('/editProblemFile', [ensureAdmin, upload], function(req, res) {
	let contest = {
		id: req.body.id,
		filePath: path.join('data/contests', req.file.filename)
	};
	Contests.editContestProblemFile(contest).then(function successCallback(result) {
		res.send({ status: "SUCCESS", filePath: contest.filePath });
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

// Name: Stop running contest.
// Type: POST.
router.post('/stopRunningContest', [ensureAdmin], function(req, res) {
	Contests.getCurrentContestId().then(function successCallback(id) {
		Contests.getContest(id).then(function successCallback(contest) {
			let start = moment(contest.startTime, "HH:mm, DD/MM/YYYY");
			let end = moment(contest.endTime, "HH:mm, DD/MM/YYYY");
			if (start.isBefore(moment()) && moment().isBefore(end)) {
				Contests.stopCurrentContest(contest, false, true).then(function successCallback() {
					res.send({ status: "SUCCESS" });
				}, function errorCallback(err) {
					res.status(500).send(err.toString());
				});
			}
			else {
				res.send({ status: "No running contest"});
			}
		}, function errorCallback(err) {
			res.status(500).send(err.toString());
		});
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

// Name: Delete pending contest.
// Type: POST.
router.post('/deletePendingContest', [ensureAdmin], function(req, res) {
	Contests.getPendingContest().then(function successCallback(contest) {
		let start = moment(contest.startTime, "HH:mm, DD/MM/YYYY");
		if (moment().isBefore(start)) {
			Contests.deletePendingContest(contest).then(function successCallback() {
				res.send({ status: "SUCCESS" });
			}, function errorCallback(err) {
				res.status(500).send(err.toString());
			});
		}
		else {
			res.send({ status: "Contest has already started so it cannot be deleted"});
		}
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

module.exports = router;