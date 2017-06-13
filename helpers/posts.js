var path 		= require('path');
var DataStore 	= require('nedb');
var	Posts		= new DataStore({ filename: path.join(process.cwd(), 'data', 'posts.db'), autoload: true });
// A post has 3 fields:
// 1. title
// 2. author
// 3. shorttext
// 4. content
// 5. date
// 6. lastModified

// Function to get all posts.
function getAllPosts(noContent) {
	return new Promise(function(resolve, reject) {
		Posts.find({}, function(err, posts) {
			if (err) {
				reject(Error('Could not get all posts'));
			}
			else {
				posts.sort(function(a, b) {
					return a.date - b.date;
				});
				if (noContent == "true") {
					var res = [];
					for (var i = 0; i < posts.length; i+=1) {
						res.push({
							_id: posts[i]._id,
							title: posts[i].title,
							author: posts[i].author,
							date: posts[i].date
						});
					}
					resolve(res);
				}
				else
					resolve(posts);
			}
		});
	});
}

// Function to get a post with id.
function getPostWithId(id) {
	return new Promise(function(resolve, reject) {
		Posts.findOne({ _id: id }, function(err, post) {
			if (err || !post) {
				reject(Error('Could not find post with this id'));
			}
			else {
				resolve(post);
			}
		});
	});
}

// Function to insert a new post into the database.
function addPost(post) {
	return new Promise(function(resolve, reject) {
		Posts.insert({
			title: post.title,
			author: post.author,
			date: post.date,
			shorttext: post.shorttext,
			content: post.content,
			lastModified: post.date
		}, function(err, user) {
			if (err) {
				reject(Error('Could not add new post'));
			}
			else {
				resolve();
			}
		});
	});
}

// Function to find a post with specific post's title and author.
function findPost(title, author, callback) {
	Posts.findOne({ title: title, author: author }, callback);
}

// Function to edit an existing post.
function editPost(post) {
	return new Promise(function(resolve, reject) {
		Posts.findOne({ _id: post._id }, function(err, oldPost) {
			if (err || !oldPost) {
				reject(Error('Could not find post to edit'));
			}
			else {
				Posts.update({ _id: oldPost._id }, {
					$set: { title: post.title, lastModified: post.lastModified, shorttext: post.shorttext, content: post.content }
				}, {}, function(err, numAffected) {
					if (err) {
						reject(Error('Could not update post with new info'));
					}
					else {
						resolve();
					}
				});
			}
		});
	});
}

// Function to remove a post.
function removePost(post) {
	return new Promise(function(resolve, reject) {
		Posts.findOne({ _id: post._id }, function(err, oldPost) {
			if (err || !oldPost) {
				reject(Error('Could not find post to remove'));
			}
			else {
				Posts.remove({ _id: oldPost._id }, {}, function(err, numRemoved) {
					if (err) {
						reject(Error('Could not remove post'));
					}
					else {
						resolve();
					}
				});
			}
		});
	});
}

module.exports = {
	getAllPosts: 	getAllPosts,
	getPostWithId: 	getPostWithId,
	addPost: 		addPost,
	editPost: 		editPost,
	removePost: 	removePost
};