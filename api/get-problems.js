var express 			= require('express');
var router 				= express.Router();
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var scoreboard 			= require('../helpers/scoreboard');

// Name: Get problems' names.
// Type: POST.
router.post('/', [], function(req, res) {
	var problems = scoreboard.getProblems();
	res.send({ problems: problems });
});

module.exports = router;