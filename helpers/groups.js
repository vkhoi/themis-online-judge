var path        = require('path');
var DataStore   = require('nedb');
var Groups       = new DataStore({ filename: path.join(process.cwd(), 'data', 'groups.db'), autoload: true, timestampData: true });
// A group has 3 fields:
// 1. name
// 2. members

// Function to get all groups.
function getAllGroups() {
    return new Promise(function(resolve, reject) {
        Groups.find({}, function(err, groups) {
            if (err) {
                console.log(err);
                reject(Error('Could not get all groups'));
            }
            else {
                groups.sort(function(a, b) {
                    return a.createdAt - b.createdAt;
                });
                var res = [];
                for (var i = 0; i < groups.length; i += 1) {
                    res.push({
                        _id: groups[i]._id,
                        name: groups[i].name,
                        info: groups[i].info,
                        members: groups[i].members
                    });
                }
                resolve(res);
            }
        });
    });
}

// Function to add a new groups.
function createGroup(group) {
    return new Promise(function(resolve, reject) {
        Groups.findOne({ name: group.name }, function(err, _group) {
            if (err) {
                reject(Error('Hệ thống đang gặp lỗi'));
            }
            else if (_group) {
                reject(Error('Group này đã tồn tại trong cơ sở dữ liệu'));
            }
            else {
                Groups.insert({
                    name: group.name,
                    info: group.info,
                    members: group.members
                }, function(err, user) {
                    if (err) {
                        reject(Error('Không thể thêm group mới vào cơ sở dữ liệu'));
                    }
                    else {
                        resolve();
                    }
                });
            }
        });
    });
}

// Function to get a user with username.
function getGroupWithId(_id) {
    return new Promise(function(resolve, reject) {
        Groups.findOne({ _id: _id }, function(err, group) {
            if (err || !group) {
                reject(Error('Could not find user'));
            }
            else {
                var res = {
                    name: group.name,
                    info: group.info,
                    members: group.members
                }
                resolve(res);
            }
        });
    });
}

// Function to edit a user.
function editGroup(group) {
    return new Promise(function(resolve, reject) {
        Groups.findOne({ _id: group._id }, function(err, _group) {
            if (err || !_group) {
                reject(Error('Could not find group to edit'));
            }
            else {
                Groups.update({ _id: group._id }, {
                    $set: { name: group.name, info: group.info, members: group.members }
                }, {}, function(err, numAffected) {
                    if (err) {
                        reject(Error('Could not update group with new info'));
                    }
                    else {
                        resolve();
                    }
                });
            }
        });
    });
}

// Function to remove a user.
function removeGroup(group) {
    return new Promise(function(resolve, reject) {
        Groups.findOne({ _id: group._id }, function(err, _group) {
            if (err || !_group) {
                reject(Error('Could not find group to remove'));
            }
            else {
                Groups.remove({ _id: group._id }, {}, function(err, numRemoved) {
                    if (err) {
                        reject(Error('Could not remove group'));
                    }
                    else {
                        resolve();
                    }
                });
            }
        });
    });
}

function checkUserAllowed(username, groupsId) {
    var cnt = groupsId.length;

    return new Promise(function(resolve, reject) {
        for (let i = 0; i < groupsId.length; i += 1) {
            Groups.findOne({ _id: groupsId[i] }, function(err, group) {
                if (err || !group) {
                    resolve(false);
                }
                else {
                    let members = group.members;
                    if (members.indexOf(username) > -1) {
                        resolve(true);
                    }
                    else {
                        cnt -= 1;
                        if (cnt <= 0) {
                            resolve(false);
                        }
                    }
                }
            });
        }
    });
}

module.exports = {
    getAllGroups:       getAllGroups,
    getGroupWithId:     getGroupWithId,
    createGroup:        createGroup,
    editGroup:          editGroup,
    removeGroup:        removeGroup,
    checkUserAllowed:   checkUserAllowed
};