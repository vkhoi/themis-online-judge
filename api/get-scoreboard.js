var express 			= require('express');
var router 				= express.Router();
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var scoreboard 			= require('../helpers/scoreboard');

// Name: Get scoreboard.
// Type: POST.
router.post('/', [], function(req, res) {
	scoreboard.getScoreboard().then(function successCallback(data) {
		res.send(data);
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

module.exports = router;