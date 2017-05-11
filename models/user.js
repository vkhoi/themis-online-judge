var express 	= require('express');
var router 		= express.Router();
var fs			= require('fs');
var path 		= require('path');
var readline 	= require('readline');
var UserSubLog 	= require('./user-submission-log')

// Class User to store information of a user.
class User {
	constructor(username, password, userRole) {
		this.username = username;
		this.password = password;
		this.userRole = userRole;
	}
}

// Static variable: a dictionary to store all users.
User.Users = {};

// Function to read all users from data/accounts.csv.
(function readAllUsers() {
	var lineReader = readline.createInterface({
		input: fs.createReadStream(path.join(process.cwd(), 'data', 'accounts.csv'))
	});

	// Read line by line.
	lineReader.on('line', function(line) {
		// Each account is stored on different lines, separated by a comma. Split line by comma
		// to separate username, isAdmin, and password.
		var user = line.split(',');

		// Create new instance of user and store it inside the dictionary.
		User.Users[user[0]] = new User(user[0], user[2], user[1]);
		UserSubLog.addUser(user[0]);
	});
})();

// Function to find a user with a specific username.
User.find = function(username) {
	return (username in User.Users ? User.Users[username] : null);
}

module.exports = User;