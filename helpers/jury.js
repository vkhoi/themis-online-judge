var fs 		= require('fs');
var path	= require('path');
var config	= require('../config');

// Function to retrieve score of a submission.
// Returns a Promise to specify whether Themis has done writing result file.
function retrieveResult(submissionName) {
	return new Promise(function(resolve, reject) {
		var filePath;
		if (config.mode == "debug") filePath = path.join(process.cwd(), 'uploads', 'Logs', 'log-example1.txt');
		else
			filePath = path.join(process.cwd(), 'uploads', 'Logs', submissionName + '.log');

		fs.readFile(filePath, 'utf8', function(err, fileContent) {
			if (err) {
				reject(Error('File could not be read'));
			}
			else {
				var lines = fileContent.split('\n');
				var score = lines[0].split(' ')[1];
				// if (config.mode == "debug")
				// 	resolve({
				// 		score: Math.random() * 100,
				// 		details: 'ahihi'
				// 	});
				// else
				resolve({
					score: parseFloat(score),
					details: fileContent
				});
			}
		});
	});
}

module.exports = {
	retrieveResult: retrieveResult
};
