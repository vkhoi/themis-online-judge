var express 			= require('express');
var router 				= express.Router();
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var Posts				= require('../helpers/posts.js');

// Name: Add new post.
// Type: POST.
// Data: title, author, content.
router.post('/add', [], function(req, res) {
	var title = req.body.title;
	var author = req.body.author;
	var content = req.body.content;

	Posts.addPost({ title: title, author: author, date: Date.now(), content: content }).then(function successCallback() {
		res.send({ status: 'SUCCESS' });
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

// Name: Edit post.
// Type: POST.
// Data: title, author, content.
router.post('/edit', [], function(req, res) {
	var title = req.body.title;
	var author = req.body.author;
	var content = req.body.content;

	Posts.editPost({ title: title, author: author, date: Date.now(), content: content }).then(function successCallback() {
		res.send({ status: 'SUCCESS' });
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

// Name: Remove post.
// Type: POST.
// Data: title, author.
router.post('/remove', [], function(req, res) {
	var title = req.body.title;
	var author = req.body.author;

	Posts.removePost({ title: title, author: author }).then(function successCallback() {
		res.send({ status: 'SUCCESS' });
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

module.exports = router;