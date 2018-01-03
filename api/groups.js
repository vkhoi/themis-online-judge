var express             = require('express');
var router              = express.Router();
var ensureAuthorized    = require('../helpers/ensure-authorized');
var Groups              = require('../helpers/groups.js');
var ensureAdmin         = require('../helpers/ensure-admin');
var jwt                 = require('jsonwebtoken');
var config              = require('../config');

// Name: Get all groups.
// Type: GET
router.get('/getAllGroups', [ensureAdmin], function(req, res) {
    Groups.getAllGroups().then(function successCallback(groups) {
        res.send(groups);
    }, function errorCallback(err) {
        res.status(500).send(err.toString());
    });
});

// Name: Get group with id.
// Type: GET
router.post('/getGroup', [ensureAdmin], function(req, res) {
    var _id = req.body._id;
    if (!_id) {
        res.status(500).send("No id");
    }
    else {
        Groups.getGroupWithId(_id).then(function successCallback(group) {
            res.send(group);
        }, function errorCallback(err) {
            res.status(500).send(err.toString());
        });
    }
});

// Name: Create new group.
// Type: POST.
// Data: name, info, members.
router.post('/create', [ensureAdmin], function(req, res) {
    var name = req.body.name;
    var info = req.body.info;
    var members = req.body.members;

    Groups.createGroup({ name: name, info: info, members: members }).then(function successCallback() {
        res.send({ status: 'SUCCESS' });
    }, function errorCallback(err) {
        res.status(500).send(err.toString());
    });
});

// Name: Edit group.
// Type: POST.
// Data: name, info, members.
router.post('/edit', [ensureAdmin], function(req, res) {
    var _id = req.body._id;
    var name = req.body.name;
    var info = req.body.info;
    var members = req.body.members;

    Groups.editGroup({ _id: _id, name: name, info: info, members: members }).then(function successCallback() {
        res.send({ status: 'SUCCESS' });
    }, function errorCallback(err) {
        res.status(500).send(err.toString());
    });
});

// Name: Remove group.
// Type: POST.
// Data: username.
router.post('/remove', [ensureAdmin], function(req, res) {
    var _id = req.body._id;

    Groups.removeGroup({ _id: _id }).then(function successCallback() {
        res.send({ status: 'SUCCESS' });
    }, function errorCallback(err) {
        res.status(500).send(err.toString());
    });
});

module.exports = router;