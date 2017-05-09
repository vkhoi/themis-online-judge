// All api routes are defined here.

var express 	= require('express');
var router 		= express.Router();
var fs			= require('fs');
var path 		= require('path');
var readline 	= require('readline');
var jwt			= require('jsonwebtoken');
var redis		= require('redis');

var redisClient = redis.createClient();
redisClient.on('connect', function() {
});

var config = require('./config');

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

// Function to ensure that the request's headers contain field "authorization",
// which contains the token key.
function ensureAuthorized(req, res, next) {
	// Store the token.
    var bearerToken;

    var bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined') {
    	// Found "authorization" in headers.
        var bearer = bearerHeader.split(" ");
        // Retrieve the token.
        bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    }
    else {
    	// Cannot find field "authorization" in headers -> return 403 (Forbidden).
        res.send(403);
    }
}

// Name: Log in.
// Type: POST.
// Data: (username AND password) OR token.
router.post('/login', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	var token = req.body.token;

	// Check if log in using token or username+password.
	if (token) {
		redisClient.get(token, function(err, reply) {
			if (reply) {
				var username = reply, userRole;
				for (var i = 0; i < Users.length; i += 1) {
					var user = Users[i];
					if (user[0] == username) {
						userRole = user[1];
						break;
					}
				}
				res.json({
					user: {
						username: username,
						userRole: userRole,
						token: token
					}
				});
				return;
			}
			var message = {};
			message.status = 'FAILED';
			message.description = 'Session Expired';
			res.status(401).send(message);
		});
		return;
	}

	// Flag to indicate whether there exists this username.
	var accountExisted = false;

	for (var i = 0; i < Users.length; i += 1) {
		var user = Users[i];
		if (user[0] == username) {
			// Username exists.
			accountExisted = true;

			// Check password.
			if (user[2] == password) {
				var token = jwt.sign(username, config.JWT_SECRET);
				redisClient.set(token, username);
				redisClient.expire(token, '60');
				res.json({ 
					user: { 
						username: username,
						userRole: user[1],
						token: token
					}
				});
				return;
			}
		}
	}

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

// Name: Log out.
// Type: POST.
// Data: token.
router.post('/logout', function(req, res) {
	var token = req.body.token;

	redisClient.del(token, function(err, reply) {
		res.json({ status: 'SUCCESS' });
	});
});

module.exports = router;