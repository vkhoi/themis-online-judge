var path 		= require('path');
var DataStore 	= require('nedb');
var	UserSubLog	= new DataStore({ filename: path.join(process.cwd(), 'data', 'user-sub-log.db'),autoload: true });
var config		= require('../config');
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
		var beautifulName = beautifyFilename(submissionName);
		UserSubLog.update({ _id: user._id }, {
			$set: { [`scores.${beautifulName}`]: res.score, [`details.${beautifulName}`]: res.details }
		}, {}, function(err, numAffected) {
			if (err) {}
			else {
				console.log('added score for submission', beautifulName);
			}
		});
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
			if (err) reject(Error('Could not retrieve scores'));
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

module.exports = {
	addUser: 					addUser,
	removeUser: 				removeUser,
	addSubmission: 				addSubmission,
	addScoreDetails: 			addScoreDetails,
	getAllScoreDetails: 		getAllScoreDetails,
	getScoreDetails: 			getScoreDetails,
	getDetails: 				getDetails,
	getAllUserSubLogScores: 	getAllUserSubLogScores
};