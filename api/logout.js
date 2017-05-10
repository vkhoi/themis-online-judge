var express 	= require('express');
var router 		= express.Router();
var redis		= require('redis');

var redisClient = redis.createClient();

// Name: Log out.
// Type: POST.
// Data: token.
router.post('/', function(req, res) {
	var token = req.body.token;

	redisClient.del(token, function(err, reply) {
		res.json({ status: 'SUCCESS' });
	});
});

module.exports = router;