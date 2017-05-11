var express 	= require('express');
var router 		= express.Router();
var redis		= require('redis');

var redisClient = redis.createClient();

// Verify if request is valid.
router.use(function(req, res, next) {
	if (req.body.token) {
		next();
	}
	else {
		res.status(400).send({ message: 'Bad request' });
	}
});

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