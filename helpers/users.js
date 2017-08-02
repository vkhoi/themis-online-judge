var path 		= require('path');
var DataStore 	= require('nedb');
var UserSubLog 	= require('./user-submission-log');
var scoreboard	= require('./scoreboard');
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
						role: users[i].role,
						info: users[i].info
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
					password: user.password,
					name: user.name,
					role: user.role,
					info: user.info
				}
				resolve(res);
			}
		});
	});
}

// Function to check if a user is admin.
function isAdminUser(username) {
	return new Promise(function(resolve, reject) {
		Users.findOne({ username: username }, function(err, user) {
			if (err || !user) {
				reject(Error('Could not find user'));
			}
			else {
				if (user.role == "admin")
					resolve(true);
				else
					resolve(false);
			}
		});
	});
}

// Function to add a new user.
function addUser(user) {
	return new Promise(function(resolve, reject) {
		Users.findOne({ username: user.username }, function(err, _user) {
			if (err) {
				reject(Error('Hệ thống đang gặp lỗi'));
			}
			else if (_user) {
				reject(Error('Username này đã tồn tại trong cơ sở dữ liệu'));
			}
			else {
				Users.insert({
					username: user.username,
					password: "tinptnk", // default password
					name: user.name,
					role: user.role,
					info: user.info
				}, function(err, user) {
					if (err) {
						reject(Error('Không thể thêm user mới vào cơ sở dữ liệu'));
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
function editUser(user, editByContestant = false) {
	return new Promise(function(resolve, reject) {
		Users.findOne({ username: user.username }, function(err, _user) {
			if (err || !_user) {
				reject(Error('Could not find user to edit'));
			}
			else {
				if (editByContestant) {
					Users.update({ username: user.username }, {
						$set: { password: user.password, name: user.name }
					}, {}, function(err, numAffected) {
						if (err) {
							reject(Error('Could not update user with new info'));
						}
						else {
							resolve();
						}
					});
				}
				else {
					Users.update({ username: user.username }, {
						$set: { password: user.password, name: user.name, role: user.role, info: user.info }
					}, {}, function(err, numAffected) {
						if (err) {
							reject(Error('Could not update user with new info'));
						}
						else {
							resolve();
						}
					});
				}
			}
		});
	});
}

// Function to remove a user.
function removeUser(user) {
	return new Promise(function(resolve, reject) {
		Users.findOne({ username: user.username }, function(err, _user) {
			if (err || !_user) {
				reject(Error('Could not find user to remove'));
			}
			else {
				Users.remove({ username: user.username }, {}, function(err, numRemoved) {
					if (err) {
						reject(Error('Could not remove user'));
					}
					else {
						UserSubLog.removeUser(user.username);
						scoreboard.removeUser(user.username);
						resolve();
					}
				});
			}
		});
	});
}

(function addUltimateAdmin() {
	Users.findOne({ username: "admin" }, function(err, user) {
		if (!user) {
			addUser({ username: "admin", password: "123", name: "Admin", role: "admin", info: "admin" });
			// UserSubLog.addUser("admin");
		}
	});
})();

module.exports = {
	getAllUsers: 			getAllUsers,
	getUserWithUsername: 	getUserWithUsername,
	addUser: 				addUser,
	isAdminUser: 			isAdminUser,
	editUser: 				editUser,
	removeUser: 			removeUser
};