var path 		= require('path');
var DataStore 	= require('nedb');
var	Contests	= new DataStore({ filename: path.join(process.cwd(), 'data/contests/', 'contests.db'),autoload: true });
// A contest has 3 fields:
// 1. setter
// 2. name
// 3. topic
// 4. startTime
// 5. endTime
// 6. duration
// 7. filePath

// Function to insert a new problem into the database.
function addContest(newContest) {
	Contests.insert({
		setter: newContest.setter,
		name: newContest.name,
		topic: newContest.topic,
		startTime: newContest.startTime,
		endTime: newContest.endTime,
		duration: newContest.duration,
		filePath: newContest.filePath
	}, function(err, contest) {
		if (err) {}
		else {
			console.log('added', contest.setter, contest.name);
		}
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

module.exports = {
	addContest: 		addContest,
	getAllContests: 	getAllContests
};