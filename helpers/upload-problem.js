var path 		= require('path');
var DataStore 	= require('nedb');
var	problemList	= new DataStore({ filename: path.join(process.cwd(), 'data/problems', 'problems.db'),autoload: true });
var config		= require('../config');

// Function to insert a new problem into the database.
function addProblem(username, problemName, topic, file) {
	problemList.insert({
		username: username,
		problemName: problemName,
		date: Date.now(),
		topic: topic,
		file: file
	}, function(err, user) {
		if (err) {}
		else {
			console.log('added', username, problemName);
		}
	});
}

// Function to get all problems from database.
function getAllProblems() {
	return new Promise(function(resolve, reject) {
		problemList.find({}, function(err, data) {
			if (err) reject(Error("Could not retrieve all problems"));
			else {
				var res = [];
				data.forEach(function(problemList) {
					res.push({
						username: problemList.username,
						problemName: problemList.problemName,
						topic: problemList.topic,
						date: problemList.date,
						file: problemList.file
					});
				});
				resolve(res);
			}
		});
	});
}

module.exports = {
	addProblem: 		addProblem,
	getAllProblems: 	getAllProblems
};