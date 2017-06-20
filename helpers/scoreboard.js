var fs 			= require('fs');
var path		= require('path');
var readline 	= require('readline');
var UserSubLog	= require('../helpers/user-submission-log');

var problems = [];
var scores = {};

// Function to read all problem names from data/problems.txt.
(function readAllProblems() {
	var lineReader = readline.createInterface({
		input: fs.createReadStream(path.join(process.cwd(), 'data', 'problems.txt'))
	});

	// Read line by line.
	lineReader.on('line', function(line) {
		problems.push(line);
	});
})();

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

function getProblems() {
	return problems;
}

function getScoreboard() {
	var res = [];
	Object.keys(scores).forEach(function(username) {
		var elem = {
			username: username,
			total: scores[username].total
		};
		problems.forEach(function(problem) {
			elem[problem] = scores[username][problem];
		});
		res.push(elem);
	});
	res.sort(function(a, b) {
		return b.total - a.total;
	});
	return res;
}

function addUser(username) {
	scores[username] = {
		total: 0
	};
	problems.forEach(function(problem) {
		scores[username][problem] = 0;
	});
}

function removeUser(username) {
	delete scores[username];
}

module.exports = {
	getProblems: 	getProblems,
	updateScore: 	updateScore,
	getScoreboard: 	getScoreboard,
	addUser: 		addUser,
	removeUser:  	removeUser
};