// All api routes are defined here.

var express 	= require('express');
var router 		= express.Router();

router.use('/login', require('./login'));
router.use('/logout', require('./logout'));
router.use('/submit', require('./submit'));
router.use('/getSubmissionLogs', require('./get-submission-logs'));
router.use('/getProblems', require('./get-problems'));
router.use('/getScoreboard', require('./get-scoreboard'));
router.use('/getProblems', require('./get-problems'));
router.use('/getProblemFiles', require('./get-problem-files'));
router.use('/uploadProblem', require('./upload-problem'));

module.exports = router;