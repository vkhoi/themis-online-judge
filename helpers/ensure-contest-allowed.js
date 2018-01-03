const redis       = require('redis');
const redisClient = redis.createClient();
const Users       = require('../helpers/users.js');
const Contests    = require('../helpers/contests');
const Groups      = require('../helpers/groups.js');

// Function to ensure that the request's headers contain field "authorization",
// which contains the token key.
module.exports = function(req, res, next) {
    Contests.getCurrentContestId().then(function successCallback(contestId) {
        if (contestId == -1) {
            res.sendStatus(403);
        }
        else {
            Contests.getContest(contestId).then(function successCallback(contest) {
                if (contest.usersAllowed && contest.usersAllowed.length > 0) {
                    if (contest.usersAllowed.indexOf(req.username) == -1) {
                        res.sendStatus(403);
                    }
                    else {
                        next();
                    }
                }
                else if (contest.groupsIdAllowed && contest.groupsIdAllowed.length > 0) {
                    Groups.checkUserAllowed(req.username, contest.groupsIdAllowed).then(function successCallback(result) {
                        if (!result) {
                            res.sendStatus(403);
                        }
                        else {
                            next();
                        }
                    });
                }
                else {
                    next();
                }
            }, function errorCallback(err) {
                if (err) {
                    console.log(err.toString());
                    res.sendStatus(403);
                }
            });
        }
    });
}