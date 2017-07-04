var express 			= require('express');
var router 				= express.Router();
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var Contests 			= require('../helpers/contests');

// Name: Get scoreboard.
// Type: POST.
// Data: id (optional).
router.post('/', [ensureAuthorized], function(req, res) {
	let id = req.body.id;
	let archived = req.body.archived;
	if (archived == "true") {
		Contests.getArchivedScoreboard(id).then(function successCallback(data) {
			res.send(data);
		}, function errorCallback(err) {
			Contests.getContestScoreboard(id).then(function successCallback(data) {
				data.isNotFinal = true;
				res.send(data);
			}, function errorCallback(err) {
				res.status(500).send(err.toString());
			});
		});
	}
	else {
		Contests.getContestScoreboard(id).then(function successCallback(data) {
			res.send(data);
		}, function errorCallback(err) {
			res.status(500).send(err.toString());
		});
	}
});

module.exports = router;