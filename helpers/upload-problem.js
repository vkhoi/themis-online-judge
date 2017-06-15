var path 		= require('path');
var DataStore 	= require('nedb');
var	problemList	= new DataStore({ filename: path.join(process.cwd(), 'data/problems', 'problems.db'),autoload: true });
var config		= require('../config');
var moment 		= require('moment');

// Function to insert a new problem into the database.
function addProblem(newProblem) {
	problemList.insert(newProblem, function(err, user) {
		if (err) {}
		else {
			console.log('added', newProblem.uploadUser, newProblem.problemName);
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
				data.forEach(function(problem) {
					res.push(problem);
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