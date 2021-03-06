var path 		= require('path');
var DataStore 	= require('nedb');
var	UserSubLog	= new DataStore({ filename: path.join(process.cwd(), 'data', 'user-sub-log.db'), autoload: true });
var config		= require('../config');
var fse 		= require('fs-extra');
// A UserSubLog instance has 3 fields:
// 1. username: 	(String) username of the user.
// 2. submissions:  (Dictionary) key: submission name with format <date>[username][problem]; value: content of source code.
// 3. scores: 		(Dictionary) key: submission name; value: score. 

// Function to insert a new user into the database.
function addUser(username) {
	return new Promise(function(resolve, reject) {
		UserSubLog.findOne({ username: username }, function(err, user) {
			if (err) {
				reject(Error("Unable to find user with username"));
			}
			else if (user) {
				reject(Error("User exists"));
			}
			else {
				UserSubLog.insert({
					username: username,
					submissions: {},
					scores: {},
					details: {}
				}, function(err, user) {
					if (err) {
						reject(Error("Unable to add user"));
					}
					else {
						console.log('added', username);
						resolve(user);
					}
				});
			}
		});
	});
}

// Function to remove a user.
function removeUser(username) {
	UserSubLog.findOne({ username: username }, function(err, _user) {
		if (err || !_user) {
		}
		else {
			UserSubLog.remove({ username: username }, {}, function(err, numRemoved) {
				if (err) {
				}
				else {
					console.log('removed', username);
				}
			});
		}
	});
}

// Function to find a user with specific username.
function findUser(username, callback) {
	UserSubLog.findOne({ username: username }, callback);
}

// Function to remove extension from submission's filename and append it
// into the beginning of the name. (Ex: 123-[khoi][SEGMENT].cpp -> 123-cpp-[khoi][SEGMENT]).
// This helps insert new submission into the database easier.
function beautifyFilename(filename) {
	var tokens = filename.split('.');
	var tripped = tokens[0];
	var ext = tokens[tokens.length - 1].toLowerCase();
	tokens = tripped.split('-');
	tokens.splice(1, 0, ext);
	var newFilename = tokens.join('-');
	return newFilename;
}

// Function to add new submission.
function addSubmission(username, submissionName, fileContent) {
	return new Promise(function(resolve, reject) {
		UserSubLog.findOne({ username: username }, function(err, user) {
			if (!user) {
				addUser(username).then(function successCallback(user) {
					var beautifulName = beautifyFilename(submissionName);
					UserSubLog.update({ _id: user._id }, {
						$set: { [`submissions.${beautifulName}`]: fileContent, [`scores.${beautifulName}`]: -1}
					}, {}, function(err, numAffected) {
						if (err) {
							reject(Error("Unable to update submission for user"));
						}
						else {
							console.log('added submission', beautifulName);
							resolve();
						}
					});
				}, function errorCallback(err) {
					console.log(err.toString());
					reject(Error("Unable to add new user"));
				});
			}
			else {
				var beautifulName = beautifyFilename(submissionName);
				UserSubLog.update({ _id: user._id }, {
					$set: { [`submissions.${beautifulName}`]: fileContent, [`scores.${beautifulName}`]: -1}
				}, {}, function(err, numAffected) {
					if (err) {
						reject(Error("Unable to update submission for user"));
					}
					else {
						console.log('added submission', beautifulName);
						resolve();
					}
				});
			}
		});
	});
}

// Function to add new score and details.
function addScoreDetails(username, submissionName, res) {
	findUser(username, function(err, user) {
		if (err) {
			console.log(err.toString());
		}
		else {
			if (!user) {
				addUser(username).then(function successCallback(user) {
					var beautifulName = beautifyFilename(submissionName);
					UserSubLog.update({ _id: user._id }, {
						$set: { [`scores.${beautifulName}`]: res.score, [`details.${beautifulName}`]: res.details }
					}, {}, function(err, numAffected) {
						if (err) {}
						else {
							console.log('added score for submission', beautifulName);
						}
					});
				}, function errorCallback(err) {
					console.log(err.toString());
					reject(Error("Unable to add new user"));
				});
			}
			else {
				var beautifulName = beautifyFilename(submissionName);
				UserSubLog.update({ _id: user._id }, {
					$set: { [`scores.${beautifulName}`]: res.score, [`details.${beautifulName}`]: res.details }
				}, {}, function(err, numAffected) {
					if (err) {}
					else {
						console.log('added score for submission', beautifulName);
					}
				});
			}
		}
	});
}

// Function to get all submissions and scores for a user.
function getAllScoreDetails(username) {
	return new Promise(function(resolve, reject) {
		findUser(username, function(err, user) {
			if (err || !user) reject(Error('Could not retrieve scores'));
			else {
				resolve({
					scores: user.scores,
					details: user.details
				});
			}
		});
	});
}

// Function to get score for a submission of a user.
function getScoreDetails(username, submissionName) {
	return new Promise(function(resolve, reject) {
		findUser(username, function(err, user) {
			if (err || !user) reject(Error('Could not retrieve scores'));
			else {
				if (config.mode == "debug") {
					setTimeout(function() {
						resolve({
							scores: {[`${submissionName}`]: user.scores[submissionName]},
							details: {[`${submissionName}`]: user.details[submissionName]}
						});
					}, 3000);
				}
				else {
					resolve({
						scores: {[`${submissionName}`]: user.scores[submissionName]},
						details: {[`${submissionName}`]: user.details[submissionName]}
					});
				}
			}
		});
	});
}

// Function to get details for a submission of a user.
function getDetails(username, submissionName) {
	return new Promise(function(resolve, reject) {
		findUser(username, function(err, user) {
			if (err) reject(Error('Could not retrieve scores'));
			else {
				if (config.mode == "debug") {
					setTimeout(function() {
						resolve({[`${submissionName}`]: user.details[submissionName]});
					}, 3000);
				}
				else {
					resolve({[`${submissionName}`]: user.details[submissionName]});
				}
			}
		});
	});
}

// Function to get all data from database.
function getAllUserSubLogScores() {
	return new Promise(function(resolve, reject) {
		UserSubLog.find({}, function(err, data) {
			if (err) reject(Error("Could not retrieve all user's submission logs"));
			else {
				var res = [];
				data.forEach(function(userSubLog) {
					res.push({
						username: userSubLog.username,
						scores: userSubLog.scores
					});
				});
				resolve(res);
			}
		});
	});
}

// Function to copy /data/user-sub-log.db to /data/contests/archive.
// The copy will be appended with the contestId at the beginning of its filename.
function copyUserSubLog(contestId) {
	return new Promise(function(resolve, reject) {
		fse.copy('data/user-sub-log.db', 'data/contests/archive/' + contestId + '-user-sub-log.db', function(err) {
			if (err) {
				reject(Error(err.toString()));
			}
			else {
				resolve();
			}
		});
	});
}

// Function to clear all submission logs (to prepare for a new contest).
function clearAllSubmissions() {
	return new Promise(function(resolve, reject) {
		UserSubLog.remove({}, { multi: true }, function(err, numRemoved) {
			if (err) {
				reject(Error("Unable to clear all submissions"));
			}
			else {
				UserSubLog.loadDatabase(function(err) {
					// reload database to "really" clear all the contents.
					// (due to nedb).
				});
			}
		});
	});
}

function getSubmissionNames(username, problem) {
	return new Promise(function(resolve, reject) {
		UserSubLog.find({ username: username }, function(err, data) {
			if (err) {
				console.log(err);
				reject(err);
			}
			else {
				let submissions = data[0].submissions;
				let res = [];
				Object.keys(submissions).forEach(function(key) {
					let problem_ = key.split('[').pop().slice(0, -1);
					if (problem_ == problem) {
						res.push(key.split('-')[0]);
					}
				});
				// setTimeout(function() {
				// 	resolve(res);
				// }, 3000);
				resolve(res);
			}
		});
	});
}

function getSubmissionCode(username, problem, timeStamp) {
	return new Promise(function(resolve, reject) {
		UserSubLog.find({ username: username }, function(err, data) {
			if (err) {
				console.log(err);
				reject(err);
			}
			else {
				let submissions = data[0].submissions;
				let res = "";
				Object.keys(submissions).forEach(function(key) {
					let problem_ = key.split('[').pop().slice(0, -1);
					if (problem_ == problem) {
						let stamp = key.split('-')[0];
						if (stamp == timeStamp) {
							res = submissions[key];
							return;
						}
					}
				});
				// setTimeout(function() {
				// 	resolve(res);
				// }, 3000);
				resolve(res);
			}
		});
	});
}

module.exports = {
	addUser: 					addUser,
	removeUser: 				removeUser,
	addSubmission: 				addSubmission,
	addScoreDetails: 			addScoreDetails,
	getAllScoreDetails: 		getAllScoreDetails,
	getScoreDetails: 			getScoreDetails,
	getDetails: 				getDetails,
	getAllUserSubLogScores: 	getAllUserSubLogScores,
	copyUserSubLog: 			copyUserSubLog,
	clearAllSubmissions: 		clearAllSubmissions,
	getSubmissionNames: 		getSubmissionNames,
	getSubmissionCode: 			getSubmissionCode
};