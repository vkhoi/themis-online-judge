var express 			= require('express');
var router 				= express.Router();
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var scoreboard 			= require('../helpers/scoreboard');

// Name: Get scoreboard.
// Type: POST.
router.post('/', [], function(req, res) {
	var data = scoreboard.getScoreboard();
	res.send(data);
});

module.exports = router;