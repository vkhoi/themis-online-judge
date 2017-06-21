var express 			= require('express');
var router 				= express.Router();
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var scoreboard 			= require('../helpers/scoreboard');

// Name: Get problems' names.
// Type: POST.
router.post('/', [], function(req, res) {
	scoreboard.getProblemNames().then(function successCallback(names) {
		res.send({ problems: names });
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

module.exports = router;