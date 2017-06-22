themisApp.controller('ContestController', ['$state', '$scope', '$http', 'AuthService', 'Session', 'Upload', '$timeout', function($state, $scope, $http, AuthService, Session, Upload, $timeout) {
	var vm = this;
	vm.submissionDetails = "";
	vm.submissionLogs = [];

	vm.contestGoingOn = false;

	vm.contests = [];
	vm.runningContest = {};

	// For admin to create contest.
	vm.contestName = "";
	vm.contestTopic = "";
	vm.problemNames = [];
	vm.problemNamesString = "";
	vm.startTime = "";
	vm.endTime = "";
	vm.fileProblem = null;
	vm.fileTest = null;
	vm.uploading = false;

	// For admin to edit contest.
	vm.contestPending = {
		id: -1,
		exists: false,
		setter: "",
		name: "",
		topic: "",
		start: "",
		end: "",
		problemsString: "",
		problems: [],
		filePath: "",
		fileProblem: null
	};

	vm.hasSetCountdown = false;

	function getScoreboard(refresh = true) {
		$http.post('/api/getScoreboard').then(function successCallback(res) {
			vm.scoreboard = [];
			vm.contestGoingOn = res.data.contestExists;
			var scoreboard = res.data.scoreboard;
			if (vm.contestGoingOn) {
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
				if (refresh) {
					$timeout(function() {
						getScoreboard();
					}, 10000);
				}
			}
		});
	}

	function getProblemStatus(startTime, endTime) {
		var start = moment(startTime, "HH:mm, DD/MM/YYYY");
		var end = moment(endTime, "HH:mm, DD/MM/YYYY");
		if (end < moment()) {
			return {
				isStarted: true,
				isEnded: true,
				timeLeft: 0
			}
		}
		else if (start < moment()) {
			return {
				isStarted: true,
				isEnded: false,
				timeLeft: end - moment(),
			}
		}
		else {
			return {
				isStarted: false,
				isEnded: false,
				timeLeft: start - moment()
			}
		}
	}

	function isRunning(contest) {
		var start = moment(contest.startTime, "HH:mm, DD/MM/YYYY");
		var end = moment(contest.endTime, "HH:mm, DD/MM/YYYY");
		if (start < moment() && moment() < end) 
			return true;
		else return false;
	}

	function getContests() {
		$http.get('/api/contest/all').then(function successCallback(res) {
			vm.contests = [];
			var contests = res.data.contests;
			contests.forEach(function(contest) {
				var elem = {
					id: contest._id,
					setter: contest.setter,
					name: contest.name,
					topic: contest.topic,
					uploadUser: contest.uploadUser,
					startTime: contest.startTime,
					endTime: contest.endTime,
					duration: contest.duration,
					filePath: contest.filePath,
					status: getProblemStatus(contest.startTime, contest.endTime)
				};
				vm.contests.push(elem);
				if (isRunning(elem)) {
					vm.runningContest = elem;
					if (!vm.hasSetCountdown) {
						vm.hasSetCountdown = true;
						$timeout(countdown, 1000);
					}
				}
			});
		});
	}

	var countdown = function() {
		if (vm.runningContest.status.timeLeft > 0) {
			vm.runningContest.status.timeLeft-=1000;
			$timeout(countdown, 1000);
		}
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
		return padNumber(d.getDate(), 2) + "-" + padNumber(d.getMonth() + 1, 2) + "-" + d.getFullYear() + " " + padNumber(d.getHours(), 2) + ":" + padNumber(d.getMinutes(), 2) + ":" + padNumber(d.getSeconds(), 2);
	}

	function askJuryForScore(submissionName) {
		$http.post('/api/getSubmissionLogs', { username: Session.username, submissionName: submissionName }).then(function successCallback(res) {
			var score = res.data.scores[submissionName];
			var details = res.data.details[submissionName];
			if (score == "-1") {
				$timeout(function() {
					askJuryForScore(submissionName);
				}, 5000);
				return;
			}
			for (var i = 0; i < vm.submissionLogs.length; i += 1) {
				if (vm.submissionLogs[i].name == submissionName) {
					vm.submissionLogs[i].score = score;
					vm.submissionLogs[i].details = details;
					if (!$scope.$$phase)
						$scope.$apply();
					getScoreboard(false);
					break;
				}
			}
		}, function errorCallback(err) {
			$timeout(function() {
				askJuryForScore(submissionName);
			}, 5000);
		});
	}

	function getSubmissionLogs() {
		$http.post('/api/getSubmissionLogs', { username: Session.username} ).then(function successCallback(res) {
			var scores = res.data.scores;
			var allDetails = res.data.details;
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
					name: key,
					details: allDetails[key]
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

	function checkContestPending() {
		$http.get('/api/contest/pendingContest').then(function successCallback(res) {
			if (res.data.contest == -1) {
				vm.contestPending.exists = false;
			}
			else {
				let contest = res.data.contest;
				console.log(contest);
				vm.contestPending = {
					id: contest._id,
					exists: true,
					setter: contest.setter,
					name: contest.name,
					topic: contest.topic,
					start: contest.startTime,
					end: contest.endTime,
					problems: contest.problemNames,
					filePath: contest.filePath,
					fileProblem: null
				};

				vm.contestPending.problemsString = "";
				if (vm.contestPending.problems.length > 0) {
					vm.contestPending.problemsString = vm.contestPending.problems[0];
					for (let i = 1; i < vm.contestPending.problems.length; i += 1)
						vm.contestPending.problemsString += ", " + vm.contestPending.problems[i];
				}
			}
		}, function errorCallback(err) {
			console.log(err);
		});
	}

	function init() {
		if ($state.current.name == "home") {
			$state.go("home.scoreboard");
		}
		vm.username = Session.username;
		vm.fileSubmit = null;
		getProblemsAndScoreboard();
		getSubmissionLogs();
		getContests();
		checkContestPending();
	}
	init();

	vm.isTabActive = function(tabName) {
		return $state.current.name == tabName;
	}

	vm.selectTab = function(tabIndex) {
		if (tabIndex == 0) {
			$state.go('home.contest.admin');
		}
		else if (tabIndex == 1) {
			$state.go('home.contest.all');
		}
		else if (tabIndex == 2) {
			$state.go('home.contest.scoreboard');
		}
		else if (tabIndex == 3) {
			$state.go('home.contest.submission');
		}
		else {
			$state.go('home.contest.submission');
		}
	}

	vm.onSubmissionDetailsClick = function(index) {
		vm.submissionDetails = vm.submissionLogs[index].details;
	}

	vm.isAdmin = function() {
		return Session.userRole == "admin";
	}

	function isValidTime(startTime, endTime) {
		var start = moment(startTime, "HH:mm, DD/MM/YYYY");
		var end = moment(endTime, "HH:mm, DD/MM/YYYY");
		if (end.isBefore(start) || end.isBefore(moment())) 
			return false;

		// If the contest is already going on, there's no need to check 
		// its start time with the current time.
		if (vm.contestGoingOn)
			return true;

		// Contest has not occurred -> need to validate if its start time
		// is after the current time.
		if (start.isBefore(moment()))
			return false;

		return true;
	}

	vm.createContest = function() {
		if (vm.fileProblem == null || !vm.fileTest || vm.contestTopic == "" || vm.startTime == "" || vm.endTime == "" || vm.problemNames.length == 0) {
			swal("Thất bại!", "Vui lòng điền thời gian thi, chủ đề, tên kì thì, mã các bài tập, file đề bài, và file test.", "warning");
			return;
		}
		else if (isValidTime(vm.startTime, vm.endTime) == false) {
			swal("Thất bại!", "Thời gian thi không hợp lệ!", "warning");
			return;
		}
		vm.uploading = true;
		Upload.upload({
			url: '/api/contest/create',
			data: {
				setter: Session.username,
				name: vm.contestName,
				topic: vm.contestTopic,
				problemNames: vm.problemNames,
				startTime: vm.startTime,
				endTime: vm.endTime,
				file: vm.fileProblem
			}
		}).then(function successCallback(res) {
			if (res.data.status == "FAILED") {
				swal("Thất bại!", "Đang có kì thi sắp diễn ra hoặc chưa kết thúc!", "warning");
			}
			else {
				var id = res.data.id;
				Upload.upload({
					url: '/api/contest/addTest',
					data: {
						id: id,
						file: vm.fileTest
					}
				}).then(function successCallback(res) {
					vm.fileProblem = null;
					vm.fileTest = null
					vm.uploading = false;
					vm.contestName = "";
					vm.contestTopic = "";
					vm.startTime = "";
					vm.endTime = "";
					swal("Thành công!", "Bạn đã tạo kỳ thi.", "success");
					getContests();
					checkContestPending();
				}, function errorCallback(err) {
					console.log(err.toString());
				});
			}
		}, function errorCallback(err) {
			console.log(err.toString());
		});
	}

	function trimString(s) {
		if (s == " ") return "";
		while (s.length > 0 && s[0] == ' ')
			s = s.slice(1, s.length);
		while (s.length > 0 && s[s.length-1] == ' ')
			s = s.slice(0, -1);
		return s;
	}

	function beautifyString(s) {
		s = trimString(s);
		var res = "";
		for (var i = 0; i < s.length; i++)
			if (i == 0 || s[i] != ' ' || s[i-1] != ' ')
				res += s[i];
		return res;
	}

	vm.problemNamesChanged = function() {
		var s = beautifyString(vm.problemNamesString);
		var a = s.split(",");
		vm.problemNames = [];
		a.forEach(function(problemName) {
			name = trimString(problemName);
			if (name.length > 0)
				vm.problemNames.push(name);
		});
	}

	vm.pendingProblemNamesChanged = function() {
		var s = beautifyString(vm.contestPending.problemsString);
		var a = s.split(",");
		vm.contestPending.problems = [];
		a.forEach(function(problemName) {
			name = trimString(problemName);
			if (name.length > 0)
				vm.contestPending.problems.push(name);
		});
	}

	vm.editContest = function() {
		if (vm.contestPending.name == "" || vm.contestPending.topic == "" || vm.contestPending.problems.length == 0 || vm.contestPending.start == "" || vm.contestPending.end == "") {
			swal("Thất bại!", "Vui lòng điền thời gian thi, chủ đề, tên kì thì, mã các bài tập", "warning");
			return;
		}
		else if (!isValidTime(vm.contestPending.start, vm.contestPending.end)) {
			swal("Thất bại!", "Thời gian thi không hợp lệ!", "warning");
			return;
		}
		$http.post('/api/contest/edit', {
			id: vm.contestPending.id,
			name: vm.contestPending.name,
			topic: vm.contestPending.topic,
			problemNames: vm.contestPending.problems,
			startTime: vm.contestPending.start,
			endTime: vm.contestPending.end,
		}).then(function successCallback(res) {
			if (vm.contestPending.fileProblem) {
				Upload.upload({
					url: '/api/contest/editProblemFile',
					data: {
						id: vm.contestPending.id,
						file: vm.contestPending.fileProblem
					}
				}).then(function successCallback(res) {
					vm.contestPending.filePath = res.data.filePath;
					swal("Thành công!", "Bạn đã chỉnh sửa thông tin kì thi", "success");
					getContests();
				}, function errorCallback(err) {
					console.log(err);
				});
			}
			else {
				swal("Thành công!", "Bạn đã chỉnh sửa thông tin kì thi", "success");
				getContests();
			}
		}, function errorCallback(err) {
			console.log(err);
		});

	}

	vm.stopContest = function() {
		if (moment(vm.contestPending.start, "HH:mm, DD/MM/YYYY").isBefore(moment()) && moment().isBefore(moment(vm.contestPending.end, "HH:mm, DD/MM/YYYY"))) {
			console.log('stop Contest');
			$http.post('/api/contest/stopRunningContest').then(function successCallback(res) {
				console.log(res);
				swal("Thành công!", "Kì thi đã kết thúc!", "success");
				getContests();
				checkContestPending();
			}, function errorCallback(err) {
				console.log(err);
			});
		}
	}

	vm.isMomentBeforeNow = function(t) {
		return moment(t, "HH:mm, DD/MM/YYYY").isBefore(moment());
	}

	console.log(moment());
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

themisApp.filter('toHour', function() {
	return function(input) {
		if (!input) return 0;
		input = Math.floor(input / 1000);
		return Math.floor(input / 3600);
	}
});

themisApp.filter('toMinute', function() {
	return function(input) {
		if (!input) return 0;
		input = Math.floor(input / 1000);
		return Math.floor(input % 3600 / 60);
	}
});

themisApp.filter('toSecond', function() {
	return function(input) {
		if (!input) return 0;
		input = Math.floor(input / 1000);
		return input % 3600 % 60;
	}
});