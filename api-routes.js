// All api routes are defined here.

var express 	= require('express');
var router 		= express.Router();
var fs			= require('fs');
var path 		= require('path');
var readline 	= require('readline');
var jwt			= require('jsonwebtoken');
var redis		= require('redis');
var multer		= require('multer');
var DataStore 	= require('nedb'),
	UserSubLog	= new DataStore({ filename: path.join(process.cwd(), 'data', 'user-sub-log.db'), 							autoload: true });
var User 		= require('./models/user');
var config 		= require('./config');
var redisClient = redis.createClient();

var storage 	= multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, './uploads');
	},
	filename: function(req, file, cb) {
		var username = req.body.username;
		var problem = req.body.problem;
		var originalName = file.originalname;
		var ext = originalName.split('.').pop();
		var newname = '[' + username + '][' + problem + '].' + ext;
		cb(null, Date.now() + '-' + newname);
	}
});

var upload		= multer({ storage: storage }).single('file');

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

        // Check if token exists.
        redisClient.exists(bearerToken, function(err, reply) {
        	if (reply) {
        		req.token = bearerToken;
        		next();
        	}
        	else {
        		res.sendStatus(403);
        	}
        });
    }
    else {
    	// Cannot find field "authorization" in headers -> return 403 (Forbidden).
        res.sendStatus(403);
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
				var user = User.find(username);
				if (user) {
					res.json({
						user: {
							username: username,
							userRole: userRole,
							token: token
						}
					});
				}
				else {
					var message = {};
					message.status = 'FAILED';
					message.description = 'Account does not exist';
					res.status(401).send(message);
				}
			}
			else {
				var message = {};
				message.status = 'FAILED';
				message.description = 'Session expired';
				res.status(401).send(message);
			}
		});
		return;
	}

	var user = User.find(username);
	if (user) {
		if (user.password == password) {
			var token = jwt.sign(username, config.JWT_SECRET);
			redisClient.set(token, username);
			redisClient.expire(token, '3600');
			res.json({ 
				user: { 
					username: username,
					userRole: user.userRole,
					token: token
				}
			});
			return;
		}
	}

	// Failed response message.
	var message = {};
	message.status = 'FAILED';

	// Notify why it fails.
	if (!user)
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

// Name: Upload code.
// Type: POST.
router.post('/upload', [ensureAuthorized, upload], function(req, res) {
	upload(req, res, function(err) {
		if (err) {
			res.status(400).send('FAILED');
			return;
		}
		res.send('SUCCESS');
	});
});

module.exports = router;