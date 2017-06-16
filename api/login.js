var express 	= require('express');
var router 		= express.Router();
var jwt			= require('jsonwebtoken');
var config 		= require('../config');
var redis		= require('redis');
var Users 		= require('../helpers/users');

var redisClient = redis.createClient();

// Verify if request is valid.
router.use(function(req, res, next) {
	if (((req.body.username) && (req.body.password)) || (req.body.token))
		next();
	else {
		res.sendStatus(400);
	}
});

// Name: Log in.
// Type: POST.
// Data: (username AND password) OR token.
router.post('/', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	var token = req.body.token;

	// Check if log in using token or username+password.
	if (token) {
		// Use token.
		redisClient.get(token, function(err, reply) {
			// Check if token exists in Redis.
			if (reply) {
				// Get the username corresponds with this token.
				var username = reply, userRole;

				// Find the user with this username.
				Users.getUserWithUsername(username).then(function successCallback(user) {
					res.json({
						user: {
							username: user.username,
							userRole: user.role,
							token: token
						}
					});
				}, function errorCallback(err) {
					// User not exists.
					var message = {};
					message.status = 'FAILED';
					message.description = 'Account does not exist';
					res.status(401).send(message);
				});
			}
			else {
				// Token not exists in Redis -> must have been expired.
				var message = {};
				message.status = 'FAILED';
				message.description = 'Session expired';
				res.status(401).send(message);
			}
		});
		return;
	}

	// Log in using username+password.
	// Find user with this username.
	Users.getUserWithUsername(username).then(function successCallback(user) {
		// User exists. Check password.
		if (user.password == password) {
			// Password is correct.
			// Create token corresponds with this username.
			var token = jwt.sign(username, config.JWT_SECRET);

			// Set token along with an expiration time.
			redisClient.set(token, username);
			redisClient.expire(token, '10800');

			// Response with user's information and token.
			res.json({ 
				user: { 
					username: username,
					userRole: user.role,
					token: token
				}
			});
		}
		else {
			// Failed response message.
			var message = {};
			message.status = 'FAILED';
			message.description = 'Password is incorrect';
			
			// Unauthorized request -> exit code = 401.
			res.status(401).send(message);
		}
	}, function errorCallback(err) {
		// Failed response message.
		var message = {};
		message.status = 'FAILED';
		message.description = 'Account does not exist';

		// Unauthorized request -> exit code = 401.
		res.status(401).send(message);
	});
});

module.exports = router;