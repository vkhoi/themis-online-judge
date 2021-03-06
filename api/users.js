var express 			= require('express');
var router 				= express.Router();
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var Users				= require('../helpers/users.js');
var ensureAdmin 		= require('../helpers/ensure-admin');
var jwt					= require('jsonwebtoken');
var config 				= require('../config');

// Name: Get all users.
// Type: GET
router.get('/getAllUsers', [ensureAdmin], function(req, res) {
	Users.getAllUsers().then(function successCallback(users) {
		res.send(users);
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

// Name: Get user with username.
// Type: GET
router.post('/getUser', [ensureAdmin], function(req, res) {
	var username = req.body.username;
	if (!username) {
		res.status(500).send("No username");
	}
	else {
		Users.getUserWithUsername(username).then(function successCallback(user) {
			res.send(user);
		}, function errorCallback(err) {
			res.status(500).send(err.toString());
		})
	}
});

// Name: Add new user.
// Type: POST.
// Data: username, password, name, role.
router.post('/add', [ensureAdmin], function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	var name = req.body.name;
	var role = req.body.role;
	var info = req.body.info;

	Users.addUser({ username: username, password: password, name: name, role: role, info: info }).then(function successCallback() {
		res.send({ status: 'SUCCESS' });
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

// Name: Edit user.
// Type: POST.
// Data: username, password, name, role.
router.post('/edit', [ensureAdmin], function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	var name = req.body.name;
	var role = req.body.role;
	var info = req.body.info;

	Users.editUser({ username: username, password: password, name: name, role: role, info: info }).then(function successCallback() {
		res.send({ status: 'SUCCESS' });
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

// Name: Remove user.
// Type: POST.
// Data: username.
router.post('/remove', [ensureAdmin], function(req, res) {
	var username = req.body.username;

	Users.removeUser({ username: username }).then(function successCallback() {
		res.send({ status: 'SUCCESS' });
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

///// FOR USER TO EDIT THEIR ACCOUNTS /////
// Name: Get account's info.
// Type: GET.
router.post('/getAccount', [ensureAuthorized], function(req, res) {
	var username = req.body.username;

	if (!username) {
		res.status(500).send("No username");
	}

	var token = jwt.sign(username, config.JWT_SECRET);
	if (token != req.token) {
		res.sendStatus(500);
		return;
	}

	Users.getUserWithUsername(username).then(function successCallback(user) {
		res.send(user);
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

// Name: Edit account's info.
// Type: POST.
router.post('/editAccount', [ensureAuthorized], function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	var name = req.body.name;

	if (!username) {
		res.status(500).send("No username");
		return;
	}

	var token = jwt.sign(username, config.JWT_SECRET);
	if (token != req.token) {
		res.sendStatus(500);
		return;
	}

	Users.editUser({ username: username, password: password, name: name }, true).then(function successCallback() {
		res.send({ status: 'SUCCESS' });
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

module.exports = router;