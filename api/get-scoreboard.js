var express 			= require('express');
var router 				= express.Router();
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var contest 			= require('../helpers/contest');

// Name: Get scoreboard.
// Type: POST.
router.post('/', [], function(req, res) {
	var scoreboard = contest.getScoreboard();
	res.send(scoreboard);
});

module.exports = router;