var redis		= require('redis');
var redisClient = redis.createClient();

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
        		req.token = bearerToken;
                redisClient.get(bearerToken, function(err, reply) {
                    if (reply) {
                        req.username = reply;
                        next();
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