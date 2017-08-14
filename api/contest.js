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
const Users				= require('../helpers/users.js');
const jwt				= require('jsonwebtoken');
const config 			= require('../config');

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
		if (problem.judgedByCode == "true")
			problem.judgedByCode = "1";
		else
			problem.judgedByCode = "0";
	});

	if (moment(newContest.startTime, "HH:mm, DD/MM/YYYY") - moment() < 120000) {
		res.send({ status: 'FAILED', message: 'Thời gian bắt đầu phải cách thời điểm hiện tại ít nhất 2 phút (vì lí do hệ thống cần xử lí file test sau khi được upload lên)' });
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
			console.log(err);
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
	if (!req.file) {
		res.status(500).send("FILE NULL");
		return;
	}
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
					console.log(err);
					res.status(500).send(err.toString());
				});
			}, function errorCallback(err) {
				console.log(err);
				res.status(500).send(err.toString());
			});
		}, function errorCallback(err) {
			console.log(err);
			res.status(500).send(err.toString());
		});
	}, function errorCallback(err) {
		console.log(err);
		res.status(500).send(err.toString());
	});
});

// Name: Get all contests.
// Type: GET.
router.post('/all', [ensureAuthorized], function(req, res) {
	let username = req.body.username;
	if (!username) {
		res.status(500).send("No username");
	}

	var token = jwt.sign(username, config.JWT_SECRET);
	if (token != req.token) {
		res.sendStatus(500);
		return;
	}

	Users.isAdminUser(username).then(function successCallback(isAdmin) {
		Contests.getAllContests(isAdmin).then(function successCallback(contests){
			res.send({ contests: contests });
		}, function errorCallback(err) {
			console.log(err);
			res.status(500).send(err.toString());
		});
	}, function errorCallback(err) {
		console.log(err);
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
		console.log(err);
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
		console.log(err);
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
					console.log(err);
					res.status(500).send(err.toString());
				});
			}
			else {
				res.send({ status: "No running contest"});
			}
		}, function errorCallback(err) {
			console.log(err);
			res.status(500).send(err.toString());
		});
	}, function errorCallback(err) {
		console.log(err);
		res.status(500).send(err.toString());
	});
});

// Name: Delete contest.
// Type: POST.
router.post('/deleteContest', [ensureAdmin], function(req, res) {
	let id = req.body.id;
	if (!id) {
		res.status(500).send("No ID");
		return;
	}
	Contests.getContest(id).then(function successCallback(contest) {
		let start = moment(contest.startTime, "HH:mm, DD/MM/YYYY");
		if (moment().isBefore(start)) {
			Contests.deleteContest(contest).then(function successCallback() {
				res.send({ status: "SUCCESS" });
			}, function errorCallback(err) {
				console.log(err);
				res.status(500).send(err.toString());
			});
		}
		else {
			res.send({ status: "Contest has already started so it cannot be deleted"});
		}
	}, function errorCallback(err) {
		console.log(err);
		res.status(500).send(err.toString());
	});
});

// Name: secret API.
router.get('/secret', [], function(req, res) {
	Contests.checkJob().then(function successCallback() {
		res.send({ message: "SUCCESS" });
	}, function errorCallback(err) {
		console.log(err);
		res.send({ message: "No current contest" });
	});
});

// Name: Check if server is configuring test data.
router.get('/isConfiguringTest', [ensureAdmin], function(req, res) {
	if (Contests.checkIsConfiguringTest()) {
		res.send({ status: 'TRUE' });
	}
	else {
		res.send({ status: 'FALSE' });
	}
});

module.exports = router;