// All api routes are defined here.

var express 	= require('express');
var router 		= express.Router();

router.use('/login', require('./login'));
router.use('/logout', require('./logout'));
router.use('/submit', require('./submit'));
router.use('/getSubmissionLogs', require('./get-submission-logs'));
router.use('/getProblems', require('./get-problems'));
router.use('/getScoreboard', require('./get-scoreboard'));

module.exports = router;