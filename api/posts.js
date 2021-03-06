var express 			= require('express');
var router 				= express.Router();
var ensureAuthorized 	= require('../helpers/ensure-authorized');
var ensureAdmin 		= require('../helpers/ensure-admin');
var Posts				= require('../helpers/posts.js');
var url 				= require('url');

router.get('/getAllPosts', [ensureAuthorized], function(req, res) {
	var queryObject = url.parse(req.url, true).query;
	var noContent = queryObject['noContent'];

	Posts.getAllPosts(noContent).then(function successCallback(posts) {
		res.send(posts);
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

router.post('/getPost', [ensureAuthorized], function(req, res) {
	var id = req.body.id;
	if (!id) {
		res.status(500).send("No ID");
	}
	else {
		Posts.getPostWithId(id).then(function successCallback(post) {
			res.send(post);
		}, function errorCallback(err) {
			res.status(500).send(err.toString());
		})
	}
});

// Name: Add new post.
// Type: POST.
// Data: title, author, shorttext, content, images.
router.post('/add', [ensureAdmin], function(req, res) {
	var title = req.body.title;
	var author = req.body.author;
	var shorttext = req.body.shorttext;
	var content = req.body.content;
	var images = req.body.images;

	Posts.addPost({ title: title, author: author, date: Date.now(), shorttext: shorttext, content: content, images: images }).then(function successCallback() {
		res.send({ status: 'SUCCESS' });
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

// Name: Edit post.
// Type: POST.
// Data: id, title, shorttext, content, images.
router.post('/edit', [ensureAdmin], function(req, res) {
	var id = req.body.id;
	var title = req.body.title;
	var shorttext = req.body.shorttext;
	var content = req.body.content;
	var images = req.body.images;

	Posts.editPost({ _id: id, title: title, lastModified: Date.now(), shorttext: shorttext, content: content, images: images }).then(function successCallback() {
		res.send({ status: 'SUCCESS' });
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

// Name: Remove post.
// Type: POST.
// Data: title, author.
router.post('/remove', [ensureAdmin], function(req, res) {
	var id = req.body.id;

	Posts.removePost({ _id: id }).then(function successCallback() {
		res.send({ status: 'SUCCESS' });
	}, function errorCallback(err) {
		res.status(500).send(err.toString());
	});
});

module.exports = router;