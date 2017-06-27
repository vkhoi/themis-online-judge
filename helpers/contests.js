const path 			= require('path');
const DataStore 	= require('nedb');
const Contests		= new DataStore({ filename: path.join(process.cwd(), 'data/contests/', 'contests.db'), autoload: true });
const config 		= require('../config');
const exec			= require('child_process').exec;
const schedule 		= require('node-schedule');
const moment 		= require('moment');
const UserSubLog	= require('../helpers/user-submission-log');
const scoreboard 	= require('../helpers/scoreboard');
const fse 			= require('fs-extra');
const extract 		= require('extract-zip')
const dateTimeCvt	= require('./datetime-converter');
const EOL 			= require('os').EOL;

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
// 8. problems

const testDir 		= 'data/contests/tests';

var currentContestStartJob, currentContestEndJob;

// Function to create a new contest into the database.
function addContest(newContest) {
	return new Promise(function(resolve, reject) {
		getAllContests().then(function successCallback(allContests) {
			let ok = true;
			for (let i = 0; i < allContests.length; i += 1) {
				if (moment(allContests[i].endTime, "HH:mm, DD/MM/YYYY") >= moment()) {
					ok = false;
					break;
				}
			}
			if (ok) {
				ok = true;
				for (let i = 0; i < allContests.length; i += 1) {
					if (moment(newContest.startTime, "HH:mm, DD/MM/YYYY") - moment(allContests[i].endTime, "HH:mm, DD/MM/YYYY") < 300000) {
						ok = false;
						break;
					}
				}
				if (ok) {
					Contests.insert({
						setter: newContest.setter,
						name: newContest.name,
						topic: newContest.topic,
						startTime: newContest.startTime,
						endTime: newContest.endTime,
						duration: newContest.duration,
						filePath: newContest.filePath,
						problems: newContest.problems
					}, function(err, contest) {
						if (err) {
							console.log(err);
							reject(Error("Could not add new contest"));
						}
						else {
							console.log('added', contest);
							redisClient.set("pendingContest", contest._id);
							resolve(contest._id);
						}
					});
				}
				else {
					reject(Error("Thời gian bắt đầu phải cách thời gian kết thúc của kì thi trước ít nhất là 5 phút"));
				}
			}
			else {
				reject(Error("Đang có kì thi sắp diễn ra hoặc chưa kết thúc!"));
			}
		}, function errorCallback(err) {
			reject(Error(err.toString()));
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
						problems: contest.problems
					};
					if (moment(elem.startTime, "HH:mm, DD/MM/YYYY").isBefore(moment())) {
						elem.filePath = contest.filePath;
					}
					else {
						elem.filePath = -1;
					}
					res.push(elem);
				});
				res.sort(function(a, b) {
					if (a == b) return 0;
					if (moment(a.startTime, "HH:mm, DD/MM/YYYY").isBefore(moment(b.startTime, "HH:mm, DD/MM/YYYY")))
						return 1;
					else
						return -1;
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
				fse.pathExists(testDir + '/__MACOSX', function(err, exists) {
					if (exists) {
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
					}
					else {
						resolve();
					}
				});
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
		fse.pathExists('data/contests/Tasks', function(err, exists) {
			if (err) {
				reject(Error(err.toString()));
			}
			else {
				if (exists) {
					fse.remove('data/contests/Tasks', function(err) {
					if (err) {
						reject(Error(err.toString()));
					}
					else {
						console.log('remove folder Tasks SUCCESS');
						resolve();
					}
				});
				}
				else {
					resolve();
				}
			}
		});
	});
}

// Function to schedule the start of a contest.
function scheduleContestStart(t, contestId) {
	let startMoment = moment(t, "HH:mm, DD/MM/YYYY");
	let startTime = startMoment.toDate();
	currentContestStartJob = schedule.scheduleJob(startTime, function() {
		redisClient.set("contest", contestId);
	});
}

// Function to end current contest.
function endCurrentContest(extraJudgingTime = 1000) {
	getCurrentContestId().then(function successCallback(contestId) {
		getContest(contestId).then(function successCallback(contest) {
			// This will make client unable to see scoreboard and make submission.
			redisClient.del("contest", function(err, reply) {
				console.log('delete contest', reply);
			});
			redisClient.del("pendingContest", function(err, reply) {
			});
			// Only stop contest 5 minutes after actual endTime. This is because
			// there might be some submissions that were submitted near the end
			// of the contest and have not been graded.
			setTimeout(function() {
				let problemNames = [];
				contest.problems.forEach(function(problem) {
					problemNames.push(problem.name);
				});
				let sb = scoreboard.getScoreboard(problemNames);
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
			}, extraJudgingTime);
		}, function errorCallback(err) {
			if (err)
				console.log(err.toString());
		});
	});
}

// Function to schedule the end of a contest.
function scheduleContestEnd(t) {
	let endMoment = moment(t, "HH:mm, DD/MM/YYYY");
	let endTime = endMoment.toDate();
	currentContestEndJob = schedule.scheduleJob(endTime, function() {
		endCurrentContest();
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
				let res = [];
				console.log(contest);
				if (contest.problems)
					contest.problems.forEach(function(problem) {
						res.push(problem.name);
					});
				resolve(res);
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

// Function to get the pending contest's id.
function getPendingContestId() {
	return new Promise(function(resolve, reject) {
		redisClient.get("pendingContest", function(err, reply) {
			if (err) {
				reject(Error("Unable to get pending contest's id"));
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

// Function to get the pending contest.
function getPendingContest() {
	return new Promise(function(resolve, reject) {
		getPendingContestId().then(function successCallback(id) {
			Contests.findOne({ _id: id }, function(err, contest) {
			if (err) {
				reject(Error("Could not retrieve contest with id"));
			}
			else if (!contest) {
				resolve(-1);
			}
			else {
				resolve(contest);
			}
		});
		}, function errorCallback(err) {
			reject(Error(err.toString()));
		});
	});
}

// Function to edit the pending contest.
function editContest(contest) {
	return new Promise(function(resolve, reject) {
		getContest(contest.id).then(function successCallback(_contest) {
			if (!_contest) {
				reject(Error("Could not find this contest in database"));
			}
			else {
				let startTimeChanged = false, endTimeChanged = false;
				if (contest.startTime != _contest.startTime)
					startTimeChanged = true;
				if (contest.endTime != _contest.endTime)
					endTimeChanged = true;
				Contests.update({ _id: contest.id }, {
					$set: {
						name: contest.name,
						topic: contest.topic,
						problems: contest.problems,
						startTime: contest.startTime,
						endTime: contest.endTime,
						duration: contest.duration
					}
				}, {}, function(err, numAffected) {
					if (err) {
						reject(Error("Could not update contest's info"));
					}
					else {
						if (startTimeChanged)
							rescheduleContestStart(contest.startTime, contest.id);
						if (endTimeChanged)
							rescheduleContestEnd(contest.endTime, contest.id);
						resolve();
					}
				});
			}
		}, function errorCallback(err) {
			reject(Error(err.toString()));
		});
	});
}

// Function to edit contest's problem file.
function editContestProblemFile(contest) {
	return new Promise(function(resolve, reject) {
		getContest(contest.id).then(function successCallback(_contest) {
			if (!_contest) {
				reject(Error("Could not find this contest in database"));
			}
			else {
				Contests.update({ _id: contest.id }, {
					$set: {
						filePath: contest.filePath
					}
				}, {}, function(err, numAffected) {
					if (err) {
						reject(Error("Could not update contest's problem file"));
					}
					else {
						resolve();
					}
				});
			}
		}, function errorCallback(err) {
			reject(Error(err.toString()));
		});
	});
}

// Function to reschedule contest's start time.
function rescheduleContestStart(t, contestId) {
	currentContestStartJob.cancel();
	scheduleContestStart(t, contestId);
}

// Function to reschedule contest's end time.
function rescheduleContestEnd(t, contestId) {
	currentContestEndJob.cancel();
	scheduleContestEnd(t, contestId);
}

// Function to cancel the start+end job and stop current contest right away.
function stopCurrentContest(contest, cancelStartJob = true, cancelEndJob = true) {
	return new Promise(function(resolve, reject) {
		if (cancelStartJob)
			currentContestStartJob.cancel();
		if (cancelEndJob)
			currentContestEndJob.cancel();
		let now = moment().format("HH:mm, DD/MM/YYYY");

		Contests.update({ _id: contest._id }, {
			$set: {
				endTime: now,
				duration: dateTimeCvt.toDuration(contest.startTime, now)
			}
		}, {}, function(err, numAffected) {
			if (err) {
				reject(Error(err.toString()));
			}
			else {
				endCurrentContest();
				console.log("End contest successfully");
				resolve();
			}
		});
	});
}

// Function to delete the pending contest.
function deletePendingContest(contest) {
	return new Promise(function(resolve, reject) {
		currentContestStartJob.cancel();
		currentContestEndJob.cancel();
		redisClient.del("pendingContest", function(err, reply) {
			if (err) {
				reject(Error(err.toString()));
			}
			else {
				Contests.remove({ _id: contest._id }, {}, function(err, numRemoved) {
				if (err) {
					reject(Error(err.toString()));
				}
				else {
					console.log("delete pending contest");
					resolve();
				}
			});
			}
		});
	});
}

// Function to configure test data.
function configTest(problems) {
	return new Promise(function(resolve, reject) {
		let data = "";
		data += problems.length + EOL;
		problems.forEach(function(problem) {
			data += problem.testScore + " " + problem.timeLimit + " " + problem.memoryLimit + EOL;
		});
		console.log(data);
		fse.outputFile("data/contests/Tasks/config.txt", data, function(err) {
			if (err) {
				reject(Error(err.toString()));
			}
			else {
				if (config.mode != "debug") {
					console.log(config.autoDir);
					fse.copy("data/runAuto.bat", "data/contests/Tasks/", function(err) {
						if (err) {
							reject(Error(err.toString()));
						}
						else {
							exec(config.autoDir, function(err, stdout, stderr) {
								if (err) {
									reject(Error(err.toString()));
								}
								else {
									resolve();
								}
							});
						}
					});
				}
				else {
					resolve();
				}
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
	getArchivedScoreboard: 			getArchivedScoreboard,
	getPendingContest: 				getPendingContest,
	getPendingContestId: 			getPendingContestId,
	editContest: 					editContest,
	editContestProblemFile: 		editContestProblemFile,
	rescheduleContestStart: 		rescheduleContestStart,
	rescheduleContestEnd: 			rescheduleContestEnd,
	stopCurrentContest: 			stopCurrentContest,
	deletePendingContest: 			deletePendingContest,
	configTest: 					configTest
};