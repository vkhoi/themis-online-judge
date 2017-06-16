var redis		= require('redis');
var redisClient = redis.createClient();
var Users       = require('../helpers/users.js');

// Function to ensure that the request's headers contain field "authorization",
// which contains the token key.
module.exports = function(req, res, next) {
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
        		redisClient.get(bearerToken, function(err, reply) {
                    if (reply) {
                        var username = reply;
                        Users.isAdminUser(username).then(function successCallback(isAdmin) {
                            if (isAdmin) next();
                            else {
                                res.sendStatus(403);
                            }
                        });
                    }
                    else {
                        res.sendStatus(403);
                    }
                });
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