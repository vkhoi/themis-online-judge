
themisApp.controller('HomeController', ['$state', '$http', 'AuthService', 'Session', 'Upload', function($state, $http, AuthService, Session, Upload) {
	var vm = this;

	function getScoreboard() {
		$http.post('/api/getScoreboard').then(function successCallback(res) {
			vm.scoreboard = [];
			var scoreboard = res.data;
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
			setTimeout(function() {
				getScoreboard();
			}, 10000);
		});
	}

	function getProblemFiles() {
		$http.post('/api/getProblemFiles').then(function successCallback(res) {
			vm.problemFiles = [];
			var problems = res.data.problems;
			problems.forEach(function(problem) {
				var elem = {
					name: problem.problemName,
					date: problem.date,
					topic: problem.topic,
					uploadUser: problem.username,
					file: problem.file
				};
				vm.problemFiles.push(elem);
			});
		});
	}

	function getProblemsAndScoreboard() {
		$http.post('/api/getProblems').then(function successCallback(res) {
			vm.problems = res.data.problems;
			vm.selectedProblem = vm.problems[0];
			getScoreboard();
		});
	}

	function padNumber(number, L) {
		var res = number.toString();
		while (res.length < L)
			res = "0" + res;
		return res;
	}

	function timeToDate(timeStamp) {
		var d = new Date(timeStamp);
		return d.getFullYear() + "-" + padNumber(d.getDate(), 2) + "-" + padNumber(d.getMonth() + 1, 2) + " " + padNumber(d.getHours(), 2) + ":" + padNumber(d.getMinutes(), 2) + ":" + padNumber(d.getSeconds(), 2);
	}

	function askJuryForScore(submissionName) {
		$http.post('/api/getSubmissionLogs', { username: Session.username, submissionName: submissionName }).then(function successCallback(res) {
			var score = res.data.scores[submissionName];
			if (score == "-1") {
				setTimeout(function() {
					askJuryForScore(submissionName);
				}, 5000);
				return;
			}
			for (var i = 0; i < vm.submissionLogs.length; i += 1) {
				if (vm.submissionLogs[i].name == submissionName) {
					vm.submissionLogs[i].score = score;
					break;
				}
			}
		}, function errorCallback(err) {
			setTimeout(function() {
				askJuryForScore(submissionName);
			}, 5000);
		});
	}

	function getSubmissionLogs() {
		$http.post('/api/getSubmissionLogs', { username: Session.username} ).then(function successCallback(res) {
			var scores = res.data.scores;
			vm.submissionLogs = [];
			Object.keys(scores).forEach(function(key) {
				var timeStamp = key.split('-')[0];
				var score = scores[key];
				var problem = key.split('[').pop();
				problem = problem.slice(0, -1);

				vm.submissionLogs.push({
					time: parseInt(timeStamp),
					problem: problem,
					score: score,
					name: key
				});
			});

			vm.submissionLogs.sort(function(a, b) {
				return b.time - a.time;
			});
			var N = vm.submissionLogs.length;
			for (var i = 0; i < N; i++) {
				vm.submissionLogs[i].time = timeToDate(vm.submissionLogs[i].time);
				if (vm.submissionLogs[i].score == "-1") {
					askJuryForScore(vm.submissionLogs[i].name);
				}
			}
		});
	}

	vm.submit = function() {
		Upload.upload({
			url: '/api/submit',
			data: {
				username: Session.username,
				problem: vm.selectedProblem,
				file: vm.fileSubmit
			}
		}).then(function successCallback(res) {
			vm.fileSubmit = null;
			var latestSubmission = res.data.submissionName;
			var timeStamp = parseInt(latestSubmission.split('-')[0]);
			vm.submissionLogs.splice(0, 0, {
				time: timeToDate(timeStamp),
				problem: vm.selectedProblem,
				score: '-1',
				name: latestSubmission
			});
			askJuryForScore(latestSubmission);
		}, function errorCallback(err) {
			console.log(err);
		});
	}

	vm.uploadProblem = function() {
		Upload.upload({
			url: '/api/uploadProblem',
			data: {
				username: Session.username,
				topic: vm.problemTopic,
				file: vm.fileProblem
			}
		}).then(function successCallback(res) {
			vm.fileProblem = null;
		}, function errorCallback(err) {
			console.log(err);
		});
	}

	vm.init = function() {
		if ($state.current.name == "home") {
			$state.go("home.scoreboard");
		}
		vm.username = Session.username;
		vm.fileSubmit = null;
		getProblemsAndScoreboard();
		getSubmissionLogs();
		getProblemFiles();
	}
	vm.init();

	vm.logout = function() {
		AuthService.logout().then(function() {
			$state.go('login');
		});
	}

	vm.isTabActive = function(tabName) {
		return $state.current.name == tabName;
	}

	vm.selectTab = function(tabIndex) {
		if (tabIndex == 0) {
			$state.go('home.admin');
		}
		else if (tabIndex == 1) {
			$state.go('home.problems');
		}
		else if (tabIndex == 2) {
			$state.go('home.scoreboard');
		}
		else if (tabIndex == 3) {
			$state.go('home.submission');
		}
		else {
			$state.go('home.submission');
		}
	}
}]);

themisApp.filter('submissionResultFilter', function() {
	return function(input) {
		if (!input) return 0;
		if (input == -1) return "Đang chấm";
		return input.toFixed(2);
	}
});

themisApp.filter('fileNameFilter', function() {
	return function(input) {
		if (!input) return "Chưa chọn file nào";
		return input;
	}
});