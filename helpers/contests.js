const path 			= require('path');
const DataStore 	= require('nedb');
const Contests		= new DataStore({ filename: path.join(process.cwd(), 'data/contests/', 'contests.db'),autoload: true });
const config 		= require('../config');
const exec			= require('child_process').exec;
const schedule 		= require('node-schedule');
const moment 		= require('moment');
const UserSubLog	= require('../helpers/user-submission-log');
const scoreboard 	= require('../helpers/scoreboard');
const fse 			= require('fs-extra');
const extract 		= require('extract-zip')

// redis to store only 1 key-value pair: contest - id.
const redis			= require('redis');
const redisClient 	= redis.createClient();

// A contest has 3 fields:
// 1. setter
// 2. name
// 3. topic
// 4. startTime
// 5. endTime
// 6. duration
// 7. filePath
// 8. problemNames

const testDir 		= 'data/contests/tests';

// Function to insert a new problem into the database.
function addContest(newContest) {
	return new Promise(function(resolve, reject) {
		Contests.insert({
			setter: newContest.setter,
			name: newContest.name,
			topic: newContest.topic,
			startTime: newContest.startTime,
			endTime: newContest.endTime,
			duration: newContest.duration,
			filePath: newContest.filePath,
			problemNames: newContest.problemNames
		}, function(err, contest) {
			if (err) {
				reject(Error("Could not add new contest"));
			}
			else {
				console.log('added', contest);
				resolve(contest._id);
			}
		});
	});
}

// Function to get all contests from database.
function getAllContests() {
	return new Promise(function(resolve, reject) {
		Contests.find({}, function(err, data) {
			if (err) reject(Error("Could not retrieve all contests"));
			else {
				let res = [];
				data.forEach(function(contest) {
					let elem = {
						_id: contest._id,
						setter: contest.setter,
						name: contest.name,
						topic: contest.topic,
						startTime: contest.startTime,
						endTime: contest.endTime,
						duration: contest.duration,
						problemNames: contest.problemNames
					};
					if (moment(elem.startTime, "HH:mm, DD/MM/YYYY") < moment()) {
						elem.filePath = contest.filePath;
					}
					else {
						elem.filePath = -1;
					}
					res.push(elem);
				});
				resolve(res);
			}
		});
	});
}

// Function to get contest with id.
function getContest(id) {
	return new Promise(function(resolve, reject) {
		Contests.findOne({ _id: id }, function(err, contest) {
			if (err) {
				reject(Error("Could not retrieve contest with id"));
			}
			else {
				resolve(contest);
			}
		});
	});
}

function getExtension(filename) {
	if (filename.length == 0) return "";
	var pos = filename.indexOf('.');
	if (pos == -1) return "";
	return filename.slice(pos+1, filename.length);	
}

// Function to uncompress file test.
function uncompressFileTest(fileTestName) {
	return new Promise(function(resolve, reject) {
		var fileTestPath = path.join(testDir, fileTestName);
		// var ext = getExtension(fileTestName);
		// var command = '';
		// if (ext == 'zip') command = 'unzip ' + fileTestPath + ' -d ' + testDir;
		// else command = 'unrar x ' + fileTestPath + ' ' + testDir;
		// console.log(command);
		// exec(command, function(err, stdout, stderr) {
		extract(fileTestPath, { dir: path.join(process.cwd(), testDir) }, function(err) {
			if (err) {
				console.log(err);
				reject(Error(err.toString()));
			}
			else {
				console.log('unzip SUCCESS');
				fse.remove(testDir + '/__MACOSX', function(err) {
					if (err) {
						console.log(err.toString());
						reject(Error(err.toString()));
					}
					else {
						console.log('remove __MACOSX SUCCESS');
						resolve();
					}
				});
				resolve();
			}
		});
	});
}

// Function to move all test folders to Themis' folder.
function moveTestFolders(fileTestName) {
	return new Promise(function(resolve, reject) {
		var pos = fileTestName.indexOf('.');
		if (pos == -1) reject(Error('Invalid file test name'));
		fileTestName = fileTestName.slice(0, pos);
		fse.move(testDir + '/' + fileTestName, 'data/contests/Tasks', { overwrite: true }, function(err) {
			if (err) {
				console.log(err.toString());
				reject(Error(err.toString()));
			}
			else {
				console.log('move test folder to TASKS SUCCESS');
				resolve();
			}
		});
	});
}

// Function to clear contents of Themis's test folder.
function removeThemisTestFolder() {
	return new Promise(function(resolve, reject) {
		fse.remove('data/contests/Tasks', function(err) {
			if (err) {
				reject(Error(err.toString()));
			}
			else {
				console.log('remove folder Tasks SUCCESS');
				resolve();
			}
		});
	});
}

// Function to schedule the start of a contest.
function scheduleContestStart(t, contestId) {
	var startMoment = moment(t, "HH:mm, DD/MM/YYYY");
	var startTime = startMoment.toDate();
	schedule.scheduleJob(startTime, function() {
		redisClient.set("contest", contestId);
	});
}

// Function to schedule the end of a contest.
function scheduleContestEnd(t) {
	let endMoment = moment(t, "HH:mm, DD/MM/YYYY");
	let endTime = endMoment.toDate();
	schedule.scheduleJob(endTime, function() {
		getCurrentContestId().then(function successCallback(contestId) {
			getContest(contestId).then(function successCallback(contest) {
				// This will make client unable to see scoreboard and make submission.
				redisClient.del("contest", function(err, reply) {
					console.log('delete contest', reply);
				});
				// Only stop contest 5 minutes after actual endTime. This is because
				// there might be some submissions that were submitted near the end
				// of the contest and have not been graded.
				setTimeout(function() {
					let sb = scoreboard.getScoreboard(contest.problemNames);
					fse.outputJson('data/contests/archive/' + contestId + '-scoreboard.json', sb, function(err) {
						if (err)
							console.log(err.toString());
					});
					scoreboard.stopContest();
					UserSubLog.copyUserSubLog(contestId).then(function successCallback() {
						UserSubLog.clearAllSubmissions().then(function successCallback() {
						}, function errorCallback(err) {
							console.log(err.toString());
						});
					}, function errorCallback(err) {
						console.log(err.toString());
					});
				}, 1000);
			}, function errorCallback(err) {
				if (err)
					console.log(err.toString());
			});
		});
	});
}

// Function to get current contest's id.
function getCurrentContestId() {
	return new Promise(function(resolve, reject) {
		redisClient.get("contest", function(err, reply) {
			if (err) {
				reject(Error("Unable to get current contest's id"));
			}
			else if (reply) {
				resolve(reply);
			}
			else {
				resolve(-1);
			}
		});
	});
}

// Function to get contest's problem names.
function getContestProblemNames(id) {
	return new Promise(function(resolve, reject) {
		Contests.findOne({ _id: id }, function(err, contest) {
			if (err) {
				reject(Error("Could not retrieve contest with id"));
			}
			else if (!contest) {
				resolve([]);
			}
			else {
				resolve(contest.problemNames);
			}
		});
	});
}

// Function to get contest's scoreboard.
function getCurrentContestScoreboard() {
	return new Promise(function(resolve, reject) {
		getCurrentContestId().then(function successCallback(contestId) {
			if (contestId == -1) {
				let res = {
					contestExists: false,
					scoreboard: []
				}
				resolve(res);
			}
			else {
				getContestProblemNames(contestId).then(function successCallback(names) {
					let res = scoreboard.getScoreboard(names);
					resolve(res);
				}, function errorCallback(err) {
					reject(Error(err.toString()));
				});
			}
		}, function errorCallback(err) {
			console.log(err.toString());
			reject(Error(err.toString()));
		});
	});
}

// Function to get archived scoreboard.
function getArchivedScoreboard(contestId) {
	return new Promise(function(resolve, reject) {
		fse.readJson('data/contests/archive/' + contestId + '-scoreboard.json', function(err, res) {
			if (err) {
				reject(Error(err.toString()));
			}
			else {
				resolve(res);
			}
		});
	});
}

module.exports = {
	addContest: 					addContest,
	getAllContests: 				getAllContests,
	getContest: 					getContest,
	uncompressFileTest: 			uncompressFileTest,
	moveTestFolders: 				moveTestFolders,
	removeThemisTestFolder: 		removeThemisTestFolder,
	scheduleContestStart: 			scheduleContestStart,
	scheduleContestEnd: 			scheduleContestEnd,
	getCurrentContestId: 			getCurrentContestId,
	getContestProblemNames: 		getContestProblemNames,
	getCurrentContestScoreboard: 	getCurrentContestScoreboard,
	getArchivedScoreboard: 			getArchivedScoreboard
};