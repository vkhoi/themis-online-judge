themisApp.controller('ContestController', ['$state', '$scope', '$http', 'AuthService', 'Session', 'Upload', '$timeout', function($state, $scope, $http, AuthService, Session, Upload, $timeout) {
	var vm = this;
	vm.submissionDetails = "";
	vm.submissionLogs = [];

	vm.contestGoingOn = false;

	vm.contests = [];
	vm.runningContest = {
		exists: false
	}

	// For admin to create contest.
	vm.contestName = "";
	vm.contestTopic = "";
	vm.problems = [];
	vm.problemNamesString = "";
	vm.startTime = "";
	vm.endTime = "";
	vm.fileProblem = null;
	vm.fileTest = null;
	vm.uploading = false;

	vm.hasSetCountdown = false;
	var countdownStartedAt, countdownDuration;

	// Variable to show/hide spinner.
	vm.showSpinner = false;
	vm.showSpinnerTest = false;

	vm.uploadTestPercent = 0;

	var uploadingTest = false;

	function getScoreboard(refresh = true) {
		$http.post('/api/getScoreboard', { id: vm.runningContest.id, archived: "false" }).then(function successCallback(res) {
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
		var end = moment(contest.endTime, "HH:mm, DD/MM/YYYY");
		if (moment().isBefore(end)) 
			return true;
		else
			return false;
	}

	function getContests() {
		return new Promise(function(resolve, reject) {
			$http.get('/api/contest/all').then(function successCallback(res) {
				vm.contests = [];
				var contests = res.data.contests;
				vm.runningContest.exists = false;
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
						vm.runningContest = {
							id: contest._id,
							exists: true,
							setter: contest.setter,
							name: contest.name,
							topic: contest.topic,
							start: contest.startTime,
							end: contest.endTime,
							problems: contest.problems,
							filePath: contest.filePath,
							fileProblem: null,
							status: getProblemStatus(contest.startTime, contest.endTime)
						};
						vm.runningContest.problemsString = "";
						if (vm.runningContest.problems && vm.runningContest.problems.length > 0) {
							vm.runningContest.problemsString = vm.runningContest.problems[0].name;
							for (let i = 1; i < vm.runningContest.problems.length; i += 1)
								vm.runningContest.problemsString += ", " + vm.runningContest.problems[i].name;
						
							for (let i = 0; i < vm.runningContest.problems.length; i += 1) {
								vm.runningContest.problems[i].testScore = parseFloat(vm.runningContest.problems[i].testScore);
								vm.runningContest.problems[i].timeLimit = parseFloat(vm.runningContest.problems[i].timeLimit);
								vm.runningContest.problems[i].memoryLimit = parseInt(vm.runningContest.problems[i].memoryLimit);
							}
						}
						if (!vm.hasSetCountdown) {
							vm.hasSetCountdown = true;
							countdownStartedAt = Date.now();
							countdownDuration = vm.runningContest.status.timeLeft;
							$timeout(countdown, 1000);
						}
						resolve();
					}
				});
				resolve();
			}, function errorCallback(err) {
				reject(Error(res));
			});
		});
	}

	var countdown = function() {
		let passed = Date.now() - countdownStartedAt;
		if (passed < countdownDuration) {
			vm.runningContest.status.timeLeft = countdownDuration - passed;
			$timeout(countdown, 1000);
		}
		else {
			$state.reload();
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
		vm.showSpinner = true;
		Upload.upload({
			url: '/api/submit',
			data: {
				username: Session.username,
				problem: vm.selectedProblem,
				file: vm.fileSubmit
			}
		}).then(function successCallback(res) {
			vm.showSpinner = false;
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
			vm.showSpinner = false;
			console.log(err);
			swal("Thất bại!", "Có lỗi trong quá trình upload ", "warning");
		});
	}

	function checkrunningContest() {
		$http.get('/api/contest/pendingContest').then(function successCallback(res) {
			// console.log(res);
			if (res.data.contest == -1) {
				vm.runningContest.exists = false;
			}
			else {
				let contest = res.data.contest;
				// console.log(contest);
				vm.runningContest = {
					id: contest._id,
					exists: true,
					setter: contest.setter,
					name: contest.name,
					topic: contest.topic,
					start: contest.startTime,
					end: contest.endTime,
					problems: contest.problems,
					filePath: contest.filePath,
					fileProblem: null
				};

				vm.runningContest.problemsString = "";
				if (vm.runningContest.problems && vm.runningContest.problems.length > 0) {
					vm.runningContest.problemsString = vm.runningContest.problems[0].name;
					for (let i = 1; i < vm.runningContest.problems.length; i += 1)
						vm.runningContest.problemsString += ", " + vm.runningContest.problems[i].name;
				
					for (let i = 0; i < vm.runningContest.problems.length; i += 1) {
						vm.runningContest.problems[i].testScore = parseFloat(vm.runningContest.problems[i].testScore);
						vm.runningContest.problems[i].timeLimit = parseFloat(vm.runningContest.problems[i].timeLimit);
						vm.runningContest.problems[i].memoryLimit = parseInt(vm.runningContest.problems[i].memoryLimit);
					}
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
		getContests().then(function successCallback() {
			if (vm.runningContest.status.isStarted && !vm.runningContest.status.isEnded)
				getScoreboard();
		}, function errorCallback(err) {
			console.log(err);
		});
		getSubmissionLogs();
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
		if (start == end || end.isBefore(start) || end.isBefore(moment())) 
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
		if (vm.fileProblem == null || !vm.fileTest || vm.contestTopic == "" || vm.startTime == "" || vm.endTime == "" || vm.problems.length == 0) {
			swal("Thất bại!", "Vui lòng điền thời gian thi, chủ đề, tên kì thì, thông tin các bài tập, file đề bài, và file test.", "warning");
			return;
		}
		else if (isValidTime(vm.startTime, vm.endTime) == false) {
			swal("Thất bại!", "Thời gian thi không hợp lệ!", "warning");
			return;
		}
		else if (!uploadingTest || vm.uploadTestPercent < 100) {
			swal("Thất bại!", "Xin hãy đợi sau khi upload xong file test", "warning");
			return;
		}
		else if (moment(vm.startTime, "HH:mm, DD/MM/YYYY") - moment() < 180000) {
			swal("Thất bại!", "Thời gian bắt đầu phải cách thời điểm hiện tại ít nhất 3 phút (vì lí do hệ thống cần xử lí file test sau khi được upload lên)", "warning");
			return;
		}
		vm.showSpinnerTest = true;
		vm.uploading = true;

		vm.problems.forEach(function(problem) {
			problem.testScore = parseInt(problem.testScore);
			problem.timeLimit = parseInt(problem.timeLimit);
			problem.memoryLimit = parseInt(problem.memoryLimit);
		});
		
		Upload.upload({
			url: '/api/contest/create',
			data: {
				setter: Session.username,
				name: vm.contestName,
				topic: vm.contestTopic,
				problems: vm.problems,
				startTime: vm.startTime,
				endTime: vm.endTime,
				file: vm.fileProblem
			}
		}).then(function successCallback(res) {
			if (res.data.status == "FAILED") {
				vm.showSpinnerTest = false;
				let message = res.data.message;
				swal("Thất bại!", message, "warning");
			}
			else {
				vm.showSpinnerTest = false;
				swal("Thành công!", "Bạn đã tạo kỳ thi.", "success");
				getContests();
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
		let s = beautifyString(vm.problemNamesString);
		let a = s.split(",");
		vm.problems = [];
		a.forEach(function(problemName) {
			let name = trimString(problemName);
			if (name.length > 0)
				vm.problems.push({
					name: name,
					testScore: 1,
					timeLimit: 1,
					memoryLimit: 1024
				});
		});
	}

	vm.problemNamesPendingChanged = function() {
		let s = beautifyString(vm.runningContest.problemsString);
		let a = s.split(",");
		vm.runningContest.problems = [];
		a.forEach(function(problemName) {
			let name = trimString(problemName);
			if (name.length > 0)
				vm.runningContest.problems.push({
					name: name,
					testScore: 1,
					timeLimit: 1,
					memoryLimit: 1024
				});
		});
	}

	vm.pendingProblemNamesChanged = function() {
		var s = beautifyString(vm.runningContest.problemsString);
		var a = s.split(",");
		vm.runningContest.problems = [];
		a.forEach(function(problemName) {
			name = trimString(problemName);
			if (name.length > 0)
				vm.runningContest.problems.push(name);
		});
	}

	vm.editContest = function() {
		if (vm.runningContest.name == "" || vm.runningContest.topic == "" || vm.runningContest.problems.length == 0 || vm.runningContest.start == "" || vm.runningContest.end == "") {
			swal("Thất bại!", "Vui lòng điền thời gian thi, chủ đề, tên kì thì, mã các bài tập", "warning");
			return;
		}
		else if (!isValidTime(vm.runningContest.start, vm.runningContest.end)) {
			swal("Thất bại!", "Thời gian thi không hợp lệ!", "warning");
			return;
		}
		else if (moment().isBefore(moment(vm.runningContest.start, "HH:mm, DD/MM/YYYY")) && moment(vm.runningContest.start, "HH:mm, DD/MM/YYYY") - moment() < 180000) {
			swal("Thất bại!", "Thời gian bắt đầu phải cách thời điểm hiện tại ít nhất 3 phút", "warning");
			return;
		}
		vm.showSpinner = true;

		vm.runningContest.problems.forEach(function(problem) {
			problem.testScore = parseInt(problem.testScore);
			problem.timeLimit = parseInt(problem.timeLimit);
			problem.memoryLimit = parseInt(problem.memoryLimit);
		});

		$http.post('/api/contest/edit', {
			id: vm.runningContest.id,
			name: vm.runningContest.name,
			topic: vm.runningContest.topic,
			problems: vm.runningContest.problems,
			startTime: vm.runningContest.start,
			endTime: vm.runningContest.end,
		}).then(function successCallback(res) {
			if (vm.runningContest.fileProblem) {
				Upload.upload({
					url: '/api/contest/editProblemFile',
					data: {
						id: vm.runningContest.id,
						file: vm.runningContest.fileProblem
					}
				}).then(function successCallback(res) {
					vm.showSpinner = false;
					vm.runningContest.filePath = res.data.filePath;
					swal("Thành công!", "Bạn đã chỉnh sửa thông tin kì thi", "success");
					getContests();
				}, function errorCallback(err) {
					console.log(err);
				});
			}
			else {
				vm.showSpinner = false;
				swal("Thành công!", "Bạn đã chỉnh sửa thông tin kì thi", "success");
				getContests();
			}
		}, function errorCallback(err) {
			console.log(err);
		});

	}

	vm.stopContest = function() {
		if (moment(vm.runningContest.start, "HH:mm, DD/MM/YYYY").isBefore(moment()) && moment().isBefore(moment(vm.runningContest.end, "HH:mm, DD/MM/YYYY"))) {
			vm.showSpinner = true;
			$http.post('/api/contest/stopRunningContest').then(function successCallback(res) {
				vm.showSpinner = false;
				console.log(res);
				if (res.data.status == "FAILED") {
					let message = res.data.message;
					swal("Thất bại!", message, "warning");
				}
				else {
					swal("Thành công!", "Kì thi đã kết thúc!", "success");
					$state.reload();
				}
			}, function errorCallback(err) {
				console.log(err);
			});
		}
		else {
		}
	}

	vm.isMomentBeforeNow = function(t) {
		return moment(t, "HH:mm, DD/MM/YYYY").isBefore(moment());
	}

	vm.isOngoing = function(t1, t2) {
		let start = moment(t1, "HH:mm, DD/MM/YYYY");
		let end = moment(t2, "HH:mm, DD/MM/YYYY");
		return start.isBefore(moment()) && moment().isBefore(end);
	}

	vm.deleteContest = function() {
		if (moment().isBefore(moment(vm.runningContest.start, "HH:mm, DD/MM/YYYY"))) {
			vm.showSpinner = true;
			console.log('delete contest');
			$http.post('/api/contest/deletePendingContest').then(function successCallback(res) {
				vm.showSpinner = false;
				// console.log(res);
				if (res.data.status == "FAILED") {
					let message = res.data.message;
					swal("Thất bại!", message, "warning");
				}
				else {
					swal("Thành công!", "Kì thi đã bị xóa!", "success");
					$state.reload();
				}
			}, function errorCallback(err) {
				console.log(err);
			});
		}
		else {
		}
	}

	var countUp = function() {
		// console.log(vm.uploadTestPercent);
		if (vm.uploadTestPercent < 100) {
			vm.uploadTestPercent += 10;
		}
		$timeout(countUp, 1000);
	}

	vm.uploadTest = function(file) {
		uploadingTest = true;
		// $timeout(countUp, 1000);
		Upload.upload({
			url: '/api/contest/addTest',
			data: {
				file: file
			}
		}).then(function successCallback(res) {
			vm.uploadTestPercent = 100;
		}, function errorCallback(err) {
		}, function update(evt) {
			vm.uploadTestPercent = Math.min(99, parseInt(100.0 * evt.loaded / evt.total));
			// console.log(vm.uploadTestPercent);
		});
	}

	vm.uploadMessage = function(filename) {
		if (!uploadingTest)
			return "Chưa chọn file nào";
		else if (vm.uploadTestPercent >= 100)
			return "Đã upload hoàn chỉnh file " + filename;
		else {
			return "Đang upload file " + filename + " " + vm.uploadTestPercent + "%";
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