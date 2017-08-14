const path 			= require('path');
const DataStore 	= require('nedb');
const Contests		= new DataStore({ filename: path.join(process.cwd(), 'data/contests/', 'contests.db'), autoload: true });
const config 		= require('../config');
const { exec }		= require('child_process');
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

var isConfiguringTest = false;

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
					// console.log(newContest.problems);
					newContest.problems.sort(function(a, b) {
						return a.name.localeCompare(b.name);
					});
					// console.log(newContest.problems);
					configTest(newContest.problems).then(function successCallback() {
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
								resolve(contest._id);
							}
						});
					}, function errorCallback(err) {
						console.log(err);
						reject(Error(err.toString()));
					});
				}
				else {
					console.log("Thời gian bắt đầu phải cách thời gian kết thúc của kì thi trước ít nhất là 5 phút");
					reject(Error("Thời gian bắt đầu phải cách thời gian kết thúc của kì thi trước ít nhất là 5 phút"));
				}
			}
			else {
				console.log("Đang có kì thi sắp diễn ra hoặc chưa kết thúc!");
				reject(Error("Đang có kì thi sắp diễn ra hoặc chưa kết thúc!"));
			}
		}, function errorCallback(err) {
			console.log(err);
			reject(Error(err.toString()));
		});
		
	});
}

// Function to get all contests from database.
function getAllContests(isAdmin) {
	checkJob().then(function successCallback(res) {
	}, function errorCallback(err) {
	});
	return new Promise(function(resolve, reject) {
		Contests.find({}, function(err, data) {
			if (err) {
				console.log("Could not retrieve all contests");
				reject(Error("Could not retrieve all contests"));
			}
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
					if (isAdmin || moment(elem.startTime, "HH:mm, DD/MM/YYYY").isBefore(moment())) {
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
				console.log(err);
				reject(Error("Could not retrieve contest with id"));
			}
			else {
				if (contest)
					resolve(contest);
				else
					reject(Error("Not found contest with this id"));
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
		extract(fileTestPath, { dir: path.join(process.cwd(), testDir, "Tasks") }, function(err) {
			if (err) {
				console.log(err);
				reject(Error(err.toString()));
			}
			else {
				console.log('unzip SUCCESS');
				fse.remove(fileTestPath, function(err) {
					if (err) {
						console.log(err);
						reject(err);
					}
					else {
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
			}
		});
	});
}

function containFolder(dir) {
	return new Promise(function(resolve, reject) {
		fse.readdir(dir, function(err, lists) {
			if (err) {
				reject(err);
			}
			else if (lists.length == 0) {
				resolve(false, "");
			}
			else {
				let result = { status: false, dir: "", all: [] };
				for (let i = 0; i < lists.length; i += 1) {
					let dir_ = path.join(dir, lists[i]);
					stats = fse.lstatSync(dir_);
					if (stats.isDirectory()) {
						if (!result.status) {
							result.status = true;
							result.dir = dir_;
						}
						result.all.push(lists[i]);
					}
				}
				if (!result.status) {
					resolve({ status: false, dir: "" });
				}
				else
					resolve(result);
			}
		});
	});
}

function containFile(dir) {
	return new Promise(function(resolve, reject) {
		fse.readdir(dir, function(err, lists) {
			if (err) {
				reject(err);
			}
			else if (lists.length == 0) {
				resolve(false, "");
			}
			else {
				dir = path.join(dir, lists[0]);
				fse.lstat(dir, function(err, stats) {
					if (err) {
						reject(err);
					}
					else {
						if (stats.isFile()) {
							resolve({ status: true, dir: dir });
						}
						else {
							resolve({ status: false, dir: "" });
						}
					}
				});
			}
		});
	});
}

function checkFormatAndFix() {
	return new Promise(function(resolve, reject) {
		let dir1 = path.join(testDir, "Tasks");
		let dir_ = path.join(testDir, "Tasks2");
		containFolder(dir1).then(function success(result) {
			// folder01
			// console.log(result);
			if (result.status) {
				let dir2 = result.dir;
				let problems2 = result.all;
				containFolder(dir2).then(function success(result) {
					// folder01/folder02
					// console.log(result);
					if (result.status) {
						let dir3 = result.dir;
						let problems3 = result.all;
						containFolder(dir3).then(function success(result) {
							// console.log(result);
							if (result.status) {
								let dir4 = result.dir;
								containFile(dir4).then(function success(result) {
									// console.log(result);
									if (result.status) {
										fse.move(dir2, dir_, { overwrite: true }, function(err) {
											if (err) {
												console.log(err);
												reject(err);
											}
											else {
												let d = Date.now();
												let newName = d.toString();
												fse.copy(dir_, path.join(testDir, newName), function(err) {
													if (err) {
														console.log(err);
														reject(err);
													}
													else {
														fse.remove(dir1, function(err) {
															if (err) {
																console.log(err);
																reject(err);
															}
															else {
																console.log("move", dir_, dir1);
																fse.move(dir_, dir1, function(err) {
																	if (err) {
																		console.log(err);
																		reject(err);
																	}
																	else {
																		console.log("check format OK");
																		resolve({ testArchive: newName, problems: problems3 });
																	}
																});
															}
														});
													}
												});
											}
										});
									}
								}, function error(err) {
									console.log(err);
									reject(err);
								});
							}
							else {
								let d = Date.now();
								let newName = d.toString();
								fse.copy(dir1, path.join(testDir, newName), function(err) {
									if (err) {
										console.log(err);
										reject(err);
									}
									else {
										resolve({ testArchive: newName, problems: problems2 });
									}
								});
							}
						}, function error(err) {
							console.log(err);
							reject(err);
						});
					}
				}, function error(err) {
					console.log(err);
					reject(err);
				});
			}
		}, function error(err) {
			console.log(err);
			reject(err);
		});
	});
}

// Function to move all test folders to Themis' folder.
function moveTestFolders(fileTestName) {
	return new Promise(function(resolve, reject) {
		var pos = fileTestName.indexOf('.');
		if (pos == -1) reject(Error('Invalid file test name'));
		fileTestName = fileTestName.slice(0, pos);
		fse.move(path.join(testDir, "Tasks"), 'data/contests/Tasks', { overwrite: true }, function(err) {
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
function endCurrentContest(extraJudgingTime = 300000) {
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
				let problemNames = [];
				contest.problems.forEach(function(problem) {
					problemNames.push(problem.name);
				});
				scoreboard.getScoreboard(problemNames).then(function successCallback(sb) {
					fse.outputJson('data/contests/archive/' + contestId + '-scoreboard.json', sb, function(err) {
						if (err)
							console.log(err);
					});
					scoreboard.stopContest();
					UserSubLog.copyUserSubLog(contestId).then(function successCallback() {
						UserSubLog.clearAllSubmissions().then(function successCallback() {
						}, function errorCallback(err) {
							console.log(err);
						});
					}, function errorCallback(err) {
						console.log(err);
					});
				}, function errorCallback(err) {
					console.log(err);
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
				// console.log(contest);
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
function getContestScoreboard(id) {
	return new Promise(function(resolve, reject) {
		getContestProblemNames(id).then(function successCallback(names) {
			scoreboard.getScoreboard(names).then(function successCallback(res) {
				resolve(res);
			}, function errorCallback(err) {
				console.log(err);
				reject(Error(err.toString()));
			});
		}, function errorCallback(err) {
			console.log(err);
			reject(Error(err.toString()));
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
					scoreboard.getScoreboard(names).then(function successCallback(res) {
						resolve(res);
					}, function errorCallback(err) {
						console.log(err);
						reject(Error(err.toString()));
					});
				}, function errorCallback(err) {
					console.log(err);
					reject(Error(err.toString()));
				});
			}
		}, function errorCallback(err) {
			console.log(err);
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

// Function to edit contest.
function editContest(contest) {
	return new Promise(function(resolve, reject) {
		getContest(contest.id).then(function successCallback(_contest) {
			if (!_contest) {
				reject(Error("Could not find this contest in database"));
			}
			else {
				if (contest.startTime != _contest.startTime && moment(_contest.startTime, "HH:mm, DD/MM/YYYY").isBefore(moment())) {
					reject(Error("Invalid start time"));
				}
				else {
					let startTimeChanged = false, endTimeChanged = false, problemsChanged = false;
					if (contest.startTime != _contest.startTime)
						startTimeChanged = true;
					if (contest.endTime != _contest.endTime)
						endTimeChanged = true;

					// console.log(contest.problems);
					contest.problems.sort(function(a, b) {
						return a.name.localeCompare(b.name);
					});
					// console.log(contest.problems);

					for (let i = 0; i < contest.problems.length; i += 1) {
						if (contest.problems[i].timeLimit != _contest.problems[i].timeLimit ||
							contest.problems[i].memoryLimit != _contest.problems[i].memoryLimit ||
							contest.problems[i].testScore != _contest.problems[i].testScore) {
							problemsChanged = true;
							break;
						}
					}

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
							if (problemsChanged) {
								configTest(contest.problems).then(function successCallback() {
									resolve();
								}, function errorCallback(err) {
									reject(Error(err.toString()));
								});
							}
							else {
								resolve();
							}
						}
					});
				}
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

// Function to delete contest.
function deleteContest(contest) {
	return new Promise(function(resolve, reject) {
		if (currentContestStartJob != null)
			currentContestStartJob.cancel();
		if (currentContestEndJob != null)
			currentContestEndJob.cancel();
		Contests.remove({ _id: contest._id }, {}, function(err, numRemoved) {
			if (err) {
				console.log(err);
				reject(Error(err.toString()));
			}
			else {
				console.log("delete contest");
				resolve();
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
			data += problem.testScore + " " + problem.timeLimit + " " + problem.memoryLimit + " " + problem.judgedByCode + EOL;
		});
		fse.outputFile("data/contests/Tasks/config.txt", data, function(err) {
			if (err) {
				reject(Error(err.toString()));
			}
			else {
				if (config.mode != "debug") {
					fse.outputFile("data/contests/RunAuto/Run.txt", "ahihi", function(err) {
						if (err) {
							reject(Error(err.toString()));
						}
						else {
							console.log("output Run.txt success");
							let expectedWaitTime = (Math.floor(problems.length * 10 / 30) + 1) * 30;
							isConfiguringTest = true;
							setTimeout(function() {
								isConfiguringTest = false;
								resolve();
							}, expectedWaitTime * 1000);
						}
					});
				}
				else {
					isConfiguringTest = true;
					// setTimeout(function() {
					// 	isConfiguringTest = false;
					// 	resolve();
					// }, 30000);
					resolve();
				}
			}
		});
	});
}

function canAddNewContest() {
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
				for (let i = 0; i < allContests.length; i += 1) {
					if (moment() - moment(allContests[i].endTime, "HH:mm, DD/MM/YYYY") < 300000) {
						ok = false;
						break;
					}
				}
				if (ok) {
					resolve();
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

function regenerateContestStartJob(contest) {
	if (currentContestStartJob == null) {
		let startMoment = moment(contest.startTime, "HH:mm, DD/MM/YYYY");
		if (moment().isBefore(startMoment)) {
			let startTime = startMoment.toDate();
			currentContestStartJob = schedule.scheduleJob(startTime, function() {
				redisClient.set("contest", contest._id);
			});
		}
	}
}

function regenerateContestEndJob(contest) {
	if (currentContestEndJob == null) {
		let endMoment = moment(contest.endTime, "HH:mm, DD/MM/YYYY");
		if (moment().isBefore(endMoment)) {
			let endTime = endMoment.toDate();
			currentContestEndJob = schedule.scheduleJob(endTime, function() {
				endCurrentContest();
			});
		}
	}
}

function checkJob() {
	console.log(currentContestStartJob == null);
	console.log(currentContestEndJob == null);

	return new Promise(function(resolve, reject) {
		getCurrentContestId().then(function successCallback(id) {
			if (id == -1)
				resolve();
			else {
				getContest(id).then(function successCallback(contest) {
					if (currentContestStartJob == null)
						regenerateContestStartJob(contest);
					if (currentContestEndJob == null)
						regenerateContestEndJob(contest);
					resolve();
				}, function errorCallback(err) {
					// console.log(err);
					reject(Error(err.toString()));
				});
			}
		}, function errorCallback(err) {
			console.log(err);
			reject(Error(err.toString()));
		});
		
	});
}

function checkIsConfiguringTest() {
	return isConfiguringTest;
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
	getContestScoreboard: 			getContestScoreboard,
	getCurrentContestScoreboard: 	getCurrentContestScoreboard,
	getArchivedScoreboard: 			getArchivedScoreboard,
	editContest: 					editContest,
	editContestProblemFile: 		editContestProblemFile,
	rescheduleContestStart: 		rescheduleContestStart,
	rescheduleContestEnd: 			rescheduleContestEnd,
	stopCurrentContest: 			stopCurrentContest,
	deleteContest: 					deleteContest,
	canAddNewContest: 				canAddNewContest,
	checkJob: 						checkJob,
	checkIsConfiguringTest: 		checkIsConfiguringTest,
	checkFormatAndFix: 				checkFormatAndFix
};