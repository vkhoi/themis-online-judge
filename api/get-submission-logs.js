var express 			= require('express');
var router 				= express.Router();
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var url 				= require('url');
var UserSubLog			= require('../models/user-submission-log');

// Verify if request is valid.
router.use(function(req, res, next) {
	var username = req.body.username;
	if (username) next();
	else {
		res.sendStatus(400);
	}
});

// Name: Get all submission logs or one submission log of user from database.
// Type: POST.
router.post('/', [], function(req, res) {
	var username = req.body.username;
	var submissionName = req.body.submissionName;

	if (submissionName) {
		UserSubLog.getScore(username, submissionName).then(function successCallback(score) {
			res.send({ scores: score });
		}, function errorCallback(err) {
			res.status(500).send(err.toString());
		});
	}
	else {
		UserSubLog.getAllScore(username).then(function successCallback(scores) {
			res.send({ scores: scores});
		}, function errorCallback(err) {
			res.status(500).send(err.toString());
		});
	}
});

module.exports = router;