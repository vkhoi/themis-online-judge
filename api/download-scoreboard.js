var express 			= require('express');
var router 				= express.Router();
var ensureAdmin 		= require('../helpers/ensure-admin');
var Contests 			= require('../helpers/contests');
var url 				= require('url');

router.get('/', [], function(req, res) {
	let queryObject = url.parse(req.url, true).query;
	let id = queryObject['id'];

	Contests.getCSVScoreboard(id).then(function successCallback(data) {
		res.set({'Content-Disposition': 'attachment; filename=scoreboard-' + id + '.csv','Content-type': 'text/csv'});
		res.send(data);
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

module.exports = router;