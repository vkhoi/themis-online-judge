var express 			= require('express');
var router 				= express.Router();
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var UserSubLog			= require('../models/user-submission-log');

// Name: Get submission logs of user from database.
// Type: POST.
router.post('/', [], function(req, res) {
	var username = req.body.username;
	UserSubLog.getScore(username).then(function successCallback(scores) {
		res.send({ scores: scores});
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

module.exports = router;