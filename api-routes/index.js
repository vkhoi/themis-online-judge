// All api routes are defined here.

var express 	= require('express');
var router 		= express.Router();
var fs			= require('fs');
var path 		= require('path');
var readline 	= require('readline');

// Array to store all user accounts in data/accounts.csv.
Users = [];

// Function to read all user accounts in data/accounts.csv.
(function readAllUsers() {
	var lineReader = readline.createInterface({
		input: fs.createReadStream(path.join(process.cwd(), 'data', 'accounts.csv'))
	});

	// Read line by line.
	lineReader.on('line', function(line) {
		// Each account is stored on different lines, separated by a comma. Split line by comma
		// to separate username, isAdmin, and password.
		var user = line.split(',');

		Users.push(user);
	});
})();

// Name: Log in.
// Type: POST.
// Data: username, password.
router.post('/login', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;

	// Flag to indicate whether there exists this username.
	var accountExisted = false;

	Users.forEach(function(user) {
		if (user[0] == username) {
			// Username exists.
			accountExisted = true;

			// Check password.
			if (user[2] == password) {
				res.json({ user: { username: username, password: password, userRole: user[1] }});
				return;
			}
		}
	});
	if (accountExisted)
		return;

	// Failed response message.
	var message = {};
	message.status = 'FAILED';

	// Notify why it fails.
	if (!accountExisted)
		message.description = 'Account does not exist';
	else
		message.description = 'Password is incorrect';

	// Unauthorized request -> exit code = 401.
	res.status(401).send(message);
});

module.exports = router;