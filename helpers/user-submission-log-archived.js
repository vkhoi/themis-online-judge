var path 		= require('path');
var DataStore 	= require('nedb');
var config		= require('../config');
var fse 		= require('fs-extra');

function getSubmissionNames(contestId, username, problem) {
	let	UserSubLog	= new DataStore({ filename: path.join(process.cwd(), 'data', 'contests', 'archive', contestId + '-' + 'user-sub-log.db'), autoload: true });
	return new Promise(function(resolve, reject) {
		UserSubLog.find({ username: username }, function(err, data) {
			if (err) {
				console.log(err);
				reject(err);
			}
			else {
				let res = [];
				if (data.length == 0) {
					resolve(res);
					return;
				}
				let submissions = data[0].submissions;
				console.log(problem);
				Object.keys(submissions).forEach(function(key) {
					let problem_ = key.split('[').pop().slice(0, -1);
					console.log(problem_);
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

function getSubmissionCode(contestId, username, problem, timeStamp) {
	let	UserSubLog	= new DataStore({ filename: path.join(process.cwd(), 'data', 'contests', 'archive', contestId + '-' + 'user-sub-log.db'), autoload: true });
	return new Promise(function(resolve, reject) {
		UserSubLog.find({ username: username }, function(err, data) {
			if (err) {
				console.log(err);
				reject(err);
			}
			else {
				let res = "";
				if (data.length == 0) {
					resolve(res);
					return;
				}
				let submissions = data[0].submissions;
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
	getSubmissionNames: 		getSubmissionNames,
	getSubmissionCode: 			getSubmissionCode
};