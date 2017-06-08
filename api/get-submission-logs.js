var express 			= require('express');
var router 				= express.Router();
var jwt					= require('jsonwebtoken');
var config 				= require('../config');
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var UserSubLog			= require('../helpers/user-submission-log');

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
router.post('/', [ensureAuthorized], function(req, res) {
	var username = req.body.username;
	var submissionName = req.body.submissionName;

	var token = req.token;
	var expectedToken = jwt.sign(username, config.JWT_SECRET);
	if (token != expectedToken) {
		res.sendStatus(403);
	}

	if (submissionName) {
		UserSubLog.getScoreDetails(username, submissionName).then(function successCallback(result) {
			res.send({ scores: result.scores, details: result.details });
		}, function errorCallback(err) {
			res.status(500).send(err.toString());
		});
	}
	else {
		UserSubLog.getAllScoreDetails(username).then(function successCallback(result) {
			res.send({ scores: result.scores, details: result.details });
		}, function errorCallback(err) {
			res.status(500).send(err.toString());
		});
	}
});

module.exports = router;