var express 			= require('express');
var router 				= express.Router();
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var contest 			= require('../helpers/contest');

// Name: Get problems' names.
// Type: POST.
router.post('/', [], function(req, res) {
	var problems = contest.getProblems();
	res.send({ problems: problems });
});

module.exports = router;