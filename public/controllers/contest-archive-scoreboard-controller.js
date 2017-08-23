themisApp.controller('ContestArchiveScoreboardController', ['$state', '$scope', '$http', 'Session', function($state, $scope, $http, Session) {
	var vm = this;

	vm.isNotFinal = false;

	// For admin.
	vm.showCode = false;
	vm.codeRequested = false;
	vm.userSubmissionLogs = [];
	vm.userSubmissionLogsLoaded = false;
	vm.userSubmissionCode = "";
	vm.userSubmissionCodeLoaded = false;

	function init() {
		vm.id = $state.params.id;
		$http.post('/api/getProblems', { id: $state.params.id }).then(function successCallback(res) {
			vm.problems = res.data.problems;
			$http.post('/api/getScoreboard', { id: $state.params.id, archived: "true" } ).then(function successCallback(res) {
				vm.isNotFinal = res.data.isNotFinal;
				vm.scoreboard = [];
				var scoreboard = res.data.scoreboard;
				// console.log(scoreboard);
				scoreboard.forEach(function(user) {
					var elem = {
						username: user.username,
						total: user.total,
						scores: []
					};
					for (var i = 0; i < vm.problems.length; i += 1)
						elem.scores.push(user[vm.problems[i]]);
					vm.scoreboard.push(elem);
				});
			}, function errorCallback(err) {
				console.log(err);
			});
		});
	}
	init();

	vm.isAdmin = function() {
		return Session.userRole == "admin";
	}

	vm.onUserSubmissionLogs = function(username, idx) {
		vm.showCode = false;
		let problem = vm.problems[idx];
		// console.log(username, problem);

		vm.userSubmissionLogs = [];
		vm.userSubmissionLogsLoaded = false;
		$http.post('/api/getSubmissionLogs/names', { username: username, problem: problem, archived: "true", contestId: $state.params.id }).then(function success(data) {
			data = data.data;
			data.forEach(function(sub) {
				let x = timeToDate(parseInt(sub));
				vm.userSubmissionLogs.push({
					time: x,
					timeStamp: sub,
					username: username,
					problem: problem
				});
			});
			vm.userSubmissionLogsLoaded = true;
		}, function error(err) {
			console.log(err);
		});
	}

	vm.onUserSubmissionCode = function(idx) {
		let problem = vm.userSubmissionLogs[idx].problem;
		let username = vm.userSubmissionLogs[idx].username;
		let timeStamp = vm.userSubmissionLogs[idx].timeStamp;

		vm.codeRequested = true;
		vm.userSubmissionCode = "";
		$http.post('/api/getSubmissionLogs/code', { username: username, problem: problem, timeStamp: timeStamp, archived: "true", contestId: $state.params.id }).then(function success(data) {
			vm.codeRequested = false;
			vm.showCode = true;
			data = data.data;
			vm.userSubmissionCode = data;
		}, function error(err) {
			console.log(err);
		});
	}

	function timeToDate(timeStamp) {
		var d = new Date(timeStamp);
		return padNumber(d.getDate(), 2) + "-" + padNumber(d.getMonth() + 1, 2) + "-" + d.getFullYear() + " " + padNumber(d.getHours(), 2) + ":" + padNumber(d.getMinutes(), 2) + ":" + padNumber(d.getSeconds(), 2);
	}

	function padNumber(number, L) {
		var res = number.toString();
		while (res.length < L)
			res = "0" + res;
		return res;
	}

	vm.downloadScoreboard = function() {
		// let id = $state.params.id;
		// $http.post('/api/getScoreboard/download', { id: id }).then(function successCallback(data) {
		// }, function errorCallback(err) {
		// 	console.log(err);
		// });
	}
}]);