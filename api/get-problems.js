var express 			= require('express');
var router 				= express.Router();
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var Contests 			= require('../helpers/contests');

// Name: Get problems' names.
// Type: POST.
router.post('/', [ensureAuthorized], function(req, res) {
	let id = req.body.id;

	if (id) {
		Contests.getContestProblemNames(id).then(function successCallback(names) {
			res.send({ problems: names });
		}, function errorCallback(err) {
			res.status(500).send(err.toString());
		});
	}
	else {
		Contests.getCurrentContestId().then(function successCallback(contestId) {
			Contests.getContestProblemNames(contestId).then(function successCallback(names) {
				res.send({ problems: names });
			}, function errorCallback(err) {
				res.status(500).send(err.toString());
			});
		}, function errorCallback(err) {
			res.status(500).send(err.toString());
		});
	}
});

module.exports = router;