var path 		= require('path');
var DataStore 	= require('nedb');
var	Contests	= new DataStore({ filename: path.join(process.cwd(), 'data/contests/', 'contests.db'),autoload: true });
var config 		= require('../config');
var exec		= require('child_process').exec;
var schedule 	= require('node-schedule');
var moment 		= require('moment');

// redis to store only 1 key-value pair: contest - id.
var redis		= require('redis');
var redisClient = redis.createClient();

// A contest has 3 fields:
// 1. setter
// 2. name
// 3. topic
// 4. startTime
// 5. endTime
// 6. duration
// 7. filePath

var testDir 	= 'data/contests/tests';

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
			filePath: newContest.filePath
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

// Function to get all problems from database.
function getAllContests() {
	return new Promise(function(resolve, reject) {
		Contests.find({}, function(err, data) {
			if (err) reject(Error("Could not retrieve all contests"));
			else {
				resolve(data);
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
		if (config.OS == 'mac') {
			var ext = getExtension(fileTestName);
			var command = '';
			if (ext == 'zip') command = 'unzip ' + fileTestPath + ' -d ' + testDir;
			else command = 'unrar x ' + fileTestPath + ' ' + testDir;
			console.log(command);
			exec(command, function(err, stdout, stderr) {
				if (err) {
					console.log(err);
					reject(Error(err.toString()));
				}
				else {
					console.log('unzip SUCCESS');
					exec('rm -r ' + testDir + '/__MACOSX', function(err) {
						if (err) {
							console.log(err);
							reject(Error(err.toString()));
						}
						else {
							console.log('remove __MACOSX SUCCESS');
							resolve();
						}
					});
				}
			});
		}
		else {

		}
	});
}

// Function to move all test folders to Themis' folder.
function moveTestFolders(fileTestName) {
	return new Promise(function(resolve, reject) {
		var pos = fileTestName.indexOf('.');
		if (pos == -1) reject(Error('Invalid file test name'));
		fileTestName = fileTestName.slice(0, pos);
		if (config.OS == 'mac') {
			exec('mv ' + testDir + '/' + fileTestName + ' ' + 'data/contests/Tasks', function(err) {
				if (err) {
					console.log(err);
					reject(Error(err.toString()));
				}
				else {
					console.log('move test folder to TASKS SUCCESS');
					resolve();
				}
			});
		}
		else {

		}
	});
}

// Function to clear contents of Themis's test folder.
function removeThemisTestFolder() {
	return new Promise(function(resolve, reject) {
		if (config.OS == 'mac') {
			exec('rm -r data/contests/Tasks', function(err) {
				console.log('remove folder Tasks SUCCESS');
				resolve();
			});
		}
		else {

		}
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
	var endMoment = moment(t, "HH:mm, DD/MM/YYYY");
	var endTime = endMoment.toDate();
	schedule.scheduleJob(endTime, function() {
		redisClient.del("contest", function(err, reply) {
			console.log('delete contest', reply);
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

module.exports = {
	addContest: 				addContest,
	getAllContests: 			getAllContests,
	getContest: 				getContest,
	uncompressFileTest: 		uncompressFileTest,
	moveTestFolders: 			moveTestFolders,
	removeThemisTestFolder: 	removeThemisTestFolder,
	scheduleContestStart: 		scheduleContestStart,
	scheduleContestEnd: 		scheduleContestEnd,
	getCurrentContestId: 		getCurrentContestId
};