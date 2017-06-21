var fs 			= require('fs');
var path		= require('path');
var readline 	= require('readline');
var UserSubLog	= require('../helpers/user-submission-log');
var Contests 	= require('./contests');

var problems = [];
var scores = {};

function getProblemNames() {
	return new Promise(function(resolve, reject) {
		Contests.getCurrentContestId().then(function successCallback(contestId) {
			Contests.getContestProblemNames(contestId).then(function successCallback(names) {
				resolve(names);
				problems = names;
			}, function errorCallback(err) {
				reject(Error("Unable to get problem names of current contest"));
			});
		}, function errorCallback(err) {
			reject(Error("Unable to get current contest's id"));
		});
	});
}

function updateScore(username, problem, newScore) {
	if (!scores[username]) {
		scores[username] = {
			total: 0
		}
	}

	if (!scores[username][problem]) {
		scores[username][problem] = 0;
	}

	var currentScore = scores[username][problem];

	scores[username][problem] = Math.max(currentScore, newScore);
	scores[username].total += scores[username][problem] - currentScore;
}

// Function to initialize scoreboard by reading all user's submission logs.
(function initializeScoreboard() {
	UserSubLog.getAllUserSubLogScores().then(function successCallback(data) {
		data.forEach(function(userSubLog) {
			var username = userSubLog.username;
			if (!scores[username]) {
				scores[username] = {
					total: 0
				};
				problems.forEach(function(problem) {
					scores[username][problem] = 0;
				});
			}

			var allScores = userSubLog.scores;
			Object.keys(allScores).forEach(function(key) {
				var problem = key.split('[').pop().slice(0, -1);
				var newScore = allScores[key];
				updateScore(username, problem, newScore);
			});
		});
	}, function errorCallback(err) {
		console.log(err);
	});
})();

function getScoreboard() {
	var res = {
		contestExists: true,
		scoreboard: []
	};
	return new Promise(function(resolve, reject) {
		Contests.getCurrentContestId().then(function successCallback(result) {
			console.log(result);
			if (result == -1) {
				res.contestExists = false;
			}
			else {
				Object.keys(scores).forEach(function(username) {
					var elem = {
						username: username,
						total: scores[username].total
					};
					problems.forEach(function(problem) {
						elem[problem] = scores[username][problem];
					});
					res.scoreboard.push(elem);
				});
				res.scoreboard.sort(function(a, b) {
					return b.total - a.total;
				});
			}
			resolve(res);
		}, function errorCallback(err) {
			reject(Error("Unable to get current contest's scoreboard"));
		});
	});
}

function removeUser(username) {
	delete scores[username];
}

module.exports = {
	getProblemNames: 	getProblemNames,
	updateScore: 		updateScore,
	getScoreboard: 		getScoreboard,
	removeUser:  		removeUser
};