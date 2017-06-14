var express 			= require('express');
var router 				= express.Router();
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var Users				= require('../helpers/users.js');

// Name: Get all users.
// Type: GET
router.get('/getAllUsers', [ensureAuthorized], function(req, res) {
	Users.getAllUsers().then(function successCallback(users) {
		res.send(users);
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

// Name: Add new user.
// Type: POST.
// Data: title, author, content.
router.post('/add', [ensureAuthorized], function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	var name = req.body.name;
	var role = req.body.role;

	Users.addUser({ username: username, password: password, name: name, role: role }).then(function successCallback() {
		res.send({ status: 'SUCCESS' });
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

module.exports = router;