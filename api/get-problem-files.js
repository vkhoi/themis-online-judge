var express 			= require('express');
var router 				= express.Router();
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var problemList 		= require('../helpers/upload-problem');

// Name: Get problems' names.
// Type: POST.
router.post('/', [], function(req, res) {
	problemList.getAllProblems().then(function successCallback(problems){
		res.send({ problems: problems });
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

module.exports = router;