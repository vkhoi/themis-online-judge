var path 		= require('path');
var DataStore 	= require('nedb');
var	Users		= new DataStore({ filename: path.join(process.cwd(), 'data', 'accounts.db'), autoload: true, timestampData: true });
// A user has 3 fields:
// 1. username
// 2. password
// 3. name
// 4. role

// Function to get all users.
function getAllUsers() {
	return new Promise(function(resolve, reject) {
		Users.find({}, function(err, users) {
			if (err) {
				console.log(err);
				reject(Error('Could not get all users'));
			}
			else {
				users.sort(function(a, b) {
					return a.createdAt - b.createdAt;
				});
				var res = [];
				for (var i = 0; i < users.length; i += 1) {
					res.push({
						username: users[i].username,
						name: users[i].name,
						role: users[i].role
					});
				}
				resolve(res);
			}
		});
	});
}

// Function to get a user with username.
function getUserWithUsername(username) {
	return new Promise(function(resolve, reject) {
		Users.findOne({ username: username }, function(err, user) {
			if (err || !user) {
				reject(Error('Could not find user'));
			}
			else {
				var res = {
					username: user.username,
					name: user.name,
					role: user.role
				}
				resolve(res);
			}
		});
	});
}

// Function to add a new user.
function addUser(user) {
	return new Promise(function(resolve, reject) {
		Users.findOne({ username: user.username }, function(err, _user) {
			if (err) {
				reject(Error('Server got errors'));
			}
			else if (_user) {
				reject(Error('User existed'));
			}
			else {
				Users.insert({
					username: user.username,
					password: user.password,
					name: user.name,
					role: user.role
				}, function(err, user) {
					if (err) {
						reject(Error('Could not add new user'));
					}
					else {
						resolve();
					}
				});
			}
		});
	});
}

// Function to edit a user.
function editUser(user) {
	return new Promise(function(resolve, reject) {
		Users.findOne({ username: user.username }, function(err, _user) {
			if (err || !_user) {
				reject(Error('Could not find user to edit'));
			}
			else {
				Users.update({ username: user.username }, {
					$set: { name: user.name, password: user.password, role: user.role }
				}, {}, function(err, numAffected) {
					if (err) {
						reject(Error('Could not update user with new info'));
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
	getAllUsers: 			getAllUsers,
	getUserWithUsername: 	getUserWithUsername,
	addUser: 				addUser,
	editUser: 				editUser
};