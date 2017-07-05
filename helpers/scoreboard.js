var fs 			= require('fs');
var path		= require('path');
var readline 	= require('readline');
var UserSubLog	= require('../helpers/user-submission-log');

var scores = {};

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
// (function initializeScoreboard() {
// 	UserSubLog.getAllUserSubLogScores().then(function successCallback(data) {
// 		data.forEach(function(userSubLog) {
// 			var username = userSubLog.username;
// 			if (!scores[username]) {
// 				scores[username] = {
// 					total: 0
// 				};
// 				problems.forEach(function(problem) {
// 					scores[username][problem] = 0;
// 				});
// 			}

// 			var allScores = userSubLog.scores;
// 			Object.keys(allScores).forEach(function(key) {
// 				var problem = key.split('[').pop().slice(0, -1);
// 				var newScore = allScores[key];
// 				updateScore(username, problem, newScore);
// 			});
// 		});
// 	}, function errorCallback(err) {
// 		console.log(err);
// 	});
// })();

function generateScoreboardFromScores(problems) {
	res = {
		contestExists: true,
		scoreboard: []
	};
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
	return res;
}

function generateScoresFromUserSubLog(problems) {
	return new Promise(function(resolve, reject) {
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
			resolve();
		}, function errorCallback(err) {
			reject(Error(err.toString()));
		});
	});
}

function getScoreboard(problems) {
	return new Promise(function(resolve, reject) {
		let res = generateScoreboardFromScores(problems);
		if (res.scoreboard.length == 0) {
			generateScoresFromUserSubLog(problems).then(function successCallback() {
				let res = generateScoreboardFromScores(problems);
				resolve(res);
			}, function errorCallback(err) {
				reject(Error(err.toString()));
			});
		}
		else {
			resolve(res);
		}
	});
}

function removeUser(username) {
	delete scores[username];
}

function stopContest() {
	scores = {};
}

module.exports = {
	updateScore: 				updateScore,
	getScoreboard: 				getScoreboard,
	removeUser:  				removeUser,
	stopContest: 				stopContest
};