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
router.use('/contest', require('./contest'));
router.use('/uploadImage', require('./upload-image'));
router.use('/posts', require('./posts'));
router.use('/users', require('./users'));

module.exports = router;