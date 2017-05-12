var path 		= require('path');
var DataStore 	= require('nedb');
var	UserSubLog	= new DataStore({ filename: path.join(process.cwd(), 'data', 'user-sub-log.db'),autoload: true });

// A UserSubLog instance has 2 fields:
// 1. username: 	(String) username of the user.
// 2. submissions:  (Dictionary) key: submission name with format <date>[username][problem]; value: content of source code.
// 3. scores: 		(Dictionary) key: submission name; value: score. 

// Function to insert a new user into the database.
function addUser(username) {
	UserSubLog.findOne({ username: username }, function(err, user) {
		if (err) {}
		else if (user) {
		}
		else {
			UserSubLog.insert({
				username: username,
				submissions: {},
				scores: {}
			}, function(err, user) {
				if (err) {}
				else {
					console.log('added', username);
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
	findUser(username, function(err, user) {
		var beautifulName = beautifyFilename(submissionName);
		UserSubLog.update({ _id: user._id }, {
			$set: { [`submissions.${beautifulName}`]: fileContent, [`scores.${beautifulName}`]: -1}
		}, {}, function(err, numAffected) {
			if (err) {}
			else {
				console.log('added submission', beautifulName);
			}
		});
	});
}

// Function to add new score.
function addScore(username, submissionName, score) {
	findUser(username, function(err, user) {
		var beautifulName = beautifyFilename(submissionName);
		UserSubLog.update({ _id: user._id }, {
			$set: { [`scores.${beautifulName}`]: score }
		}, {}, function(err, numAffected) {
			if (err) {}
			else {
				console.log('added score for submission', beautifulName);
			}
		});
	});
}

// Function to get all submissions and scores for a user.
function getAllScore(username) {
	return new Promise(function(resolve, reject) {
		findUser(username, function(err, user) {
			if (err) reject(Error('Could not retrieve scores'));
			else {
				resolve(user.scores);
			}
		});
	});
}

// Function to get score for a submission of a user.
function getScore(username, submissionName) {
	return new Promise(function(resolve, reject) {
		findUser(username, function(err, user) {
			if (err) reject(Error('Could not retrieve scores'));
			else {
				setTimeout(function() {
					resolve({[`${submissionName}`]: user.scores[submissionName]});
				}, 3000);
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
	addSubmission: 				addSubmission,
	addScore: 					addScore,
	getAllScore: 				getAllScore,
	getScore: 					getScore,
	getAllUserSubLogScores: 	getAllUserSubLogScores
};