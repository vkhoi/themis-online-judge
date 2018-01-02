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

	var initialRunningContest = null;

	// Variable to show/hide spinner.
	vm.showSpinner = false;
	vm.showSpinnerTest = false;

	vm.uploadTestPercent = 0;

	var uploadingTest = false;

	vm.pageIndex = 1;

	// For admin.
	vm.showCode = false;
	vm.userSubmissionLogsLoaded = false;
	vm.userSubmissionLogs = [];
	vm.userSubmissionCodeLoaded = false;
	vm.codeRequested = false;
	vm.userSubmissionCode = "";

	vm.individualSelection = true;
	vm.users = [];
	vm.groups = [];
	var usersAllowed = [];
	var groupsAllowed = [];
	vm.showHideAllow = true;
	vm.chooseAllUsers = false;
	vm.chooseAllGroups = false;

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
					for (var i = 0; i < vm.runningContest.problems.length; i += 1)
						elem.scores.push(user[vm.runningContest.problems[i].name]);
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
			$http.post('/api/contest/all', { username: Session.username }).then(function successCallback(res) {
				// console.log(res);
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
						usersAllowed = contest.usersAllowed;
						groupsAllowed = contest.groupsAllowed;

						if (!groupsAllowed || groupsAllowed.length == 0) {
							vm.individualSelection = true;
							groupsAllowed = [];
						}
						else {
							vm.individualSelection = false;
							usersAllowed = [];
						}

						// console.log(vm.runningContest);
						vm.runningContest.problemsString = "";
						if (vm.runningContest.problems && vm.runningContest.problems.length > 0) {
							vm.runningContest.problemsString = vm.runningContest.problems[0].name;
							for (let i = 1; i < vm.runningContest.problems.length; i += 1)
								vm.runningContest.problemsString += ", " + vm.runningContest.problems[i].name;
						
							for (let i = 0; i < vm.runningContest.problems.length; i += 1) {
								vm.runningContest.problems[i].testScore = parseFloat(vm.runningContest.problems[i].testScore);
								vm.runningContest.problems[i].timeLimit = parseFloat(vm.runningContest.problems[i].timeLimit);
								vm.runningContest.problems[i].memoryLimit = parseInt(vm.runningContest.problems[i].memoryLimit);
								if (vm.runningContest.problems[i].judgedByCode == "1")
									vm.runningContest.problems[i].judgedByCode = true;
								else
									vm.runningContest.problems[i].judgedByCode = false;
							}
						}
						initialRunningContest = JSON.parse(JSON.stringify(vm.runningContest));
						vm.selectedProblem = vm.runningContest.problems[0].name;
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
				reject(Error(err));
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

	function checkIfIsConfiguringTest() {
		$http.get('/api/contest/isConfiguringTest').then(function successCallback(res) {
			// console.log(res);
			if (res.status == 403 || res.data.status == "FALSE") {
				vm.showSpinnerTest = false;
				getContests().then(function successCallback() {
					if (vm.runningContest.exists && vm.runningContest.status.isStarted && !vm.runningContest.status.isEnded) {
						getScoreboard();
					}
					getUsersAndGroups();
				}, function errorCallback(err) {
					getUsersAndGroups();
					console.log(err);
				});
				getSubmissionLogs();
			}
			else {
				vm.showSpinnerTest = true;
				$timeout(function() {
					vm.showSpinnerTest = true;
					checkIfIsConfiguringTest();
				}, 5000);
			}
		}, function errorCallback(err) {
			// console.log(err);
			if (err.status == 403) {
				vm.showSpinnerTest = false;
				getContests().then(function successCallback() {
					if (vm.runningContest.exists && vm.runningContest.status.isStarted && !vm.runningContest.status.isEnded) {
						getScoreboard();
					}
					getUsersAndGroups();
				}, function errorCallback(err) {
					getUsersAndGroups();
					console.log(err);
				});
				getSubmissionLogs();
			}
		});
	}

	function getUsersAndGroups() {
		$http.get('/api/users/getAllUsers').then(function successCallback(res) {
            vm.users = res.data;
            for (let i = 0; i < vm.users.length; i += 1) {
            	if (usersAllowed.indexOf(vm.users[i].username) > -1)
            		vm.users[i].isAllowed = true;
            	else
            		vm.users[i].isAllowed = false;
            }
        }, function errorCallback(err) {
            if (err.status == 403) {
                AuthService.resetAuthentication();
                $state.go('login');
            }
        });

        $http.get('/api/groups/getAllGroups').then(function successCallback(res) {
            vm.groups = res.data;
            for (let i = 0; i < vm.groups.length; i += 1) {
            	if (groupsAllowed.indexOf(vm.groups[i].name) > -1)
            		vm.groups[i].isAllowed = true;
            	else
            		vm.groups[i].isAllowed = false;
            }
        }, function errorCallback(err) {
            if (err.status == 403) {
                AuthService.resetAuthentication();
                $state.go('login');
            }
        });
	}

	function init() {
		if ($state.current.name == "home") {
			$state.go("home.scoreboard");
		}
		vm.username = Session.username;
		checkIfIsConfiguringTest();
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
		if (startTime == endTime || end.isBefore(start) || end.isBefore(moment())) 
			return false;

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
		else if (moment(vm.startTime, "HH:mm, DD/MM/YYYY") - moment() < 120000) {
			swal("Thất bại!", "Thời gian bắt đầu phải cách thời điểm hiện tại ít nhất 2 phút (vì lí do hệ thống cần xử lí file test sau khi được upload lên)", "warning");
			return;
		}
		vm.showSpinnerTest = true;
		vm.uploading = true;

		vm.problems.forEach(function(problem) {
			problem.testScore = parseInt(problem.testScore);
			problem.timeLimit = parseInt(problem.timeLimit);
			problem.memoryLimit = parseInt(problem.memoryLimit);
			if (problem.judgedByCode)
				problem.judgedByCode = true;
			else
				problem.judgedByCode = false;
		});

		if (vm.individualSelection) {
			groupsAllowed = [];
		}
		else {
			usersAllowed = [];
		}

		Upload.upload({
			url: '/api/contest/create',
			data: {
				setter: Session.username,
				name: vm.contestName,
				topic: vm.contestTopic,
				problems: vm.problems,
				startTime: vm.startTime,
				endTime: vm.endTime,
				file: vm.fileProblem,
				usersAllowed: usersAllowed,
				groupsAllowed: groupsAllowed
			}
		}).then(function successCallback(res) {
			if (res.data.status == "FAILED") {
				vm.showSpinnerTest = false;
				vm.uploading = false;
				let message = res.data.message;
				swal("Thất bại!", message, "warning");
			}
			else {
				vm.showSpinnerTest = false;
				vm.uploading = false;
				swal("Thành công!", "Bạn đã tạo kỳ thi.", "success");
				$state.reload();
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

	function isContestProblemsEdit() {
		for (let i = 0; i < initialRunningContest.problems.length; i += 1) {
			if (initialRunningContest.problems[i].timeLimit != vm.runningContest.problems[i].timeLimit || initialRunningContest.problems[i].memoryLimit != vm.runningContest.problems[i].memoryLimit || initialRunningContest.problems[i].testScore != vm.runningContest.problems[i].testScore) {
				return true;
			}
		}
		return false;
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
		else if (isContestProblemsEdit() && moment().isBefore(moment(vm.runningContest.start, "HH:mm, DD/MM/YYYY")) && moment(vm.runningContest.start, "HH:mm, DD/MM/YYYY") - moment() < 180000) {
			swal("Thất bại!", "Thời gian bắt đầu phải cách thời điểm hiện tại ít nhất 3 phút", "warning");
			return;
		}
		else if (vm.runningContest.start != initialRunningContest.start && moment(initialRunningContest.start, "HH:mm, DD/MM/YYYY").isBefore(moment())) {
			swal("Thất bại!", "Kì thi đã bắt đầu! Không thể thay đổi thời gian bắt đầu!", "warning");
			return;
		}
		// console.log(vm.runningContest.start);
		// console.log(initialRunningContest.start);
		vm.showSpinnerTest = true;

		vm.runningContest.problems.forEach(function(problem) {
			problem.testScore = parseInt(problem.testScore);
			problem.timeLimit = parseInt(problem.timeLimit);
			problem.memoryLimit = parseInt(problem.memoryLimit);
		});

		if (vm.individualSelection) {
			groupsAllowed = [];
		}
		else {
			usersAllowed = [];
		}

		$http.post('/api/contest/edit', {
			id: vm.runningContest.id,
			name: vm.runningContest.name,
			topic: vm.runningContest.topic,
			problems: vm.runningContest.problems,
			startTime: vm.runningContest.start,
			endTime: vm.runningContest.end,
			usersAllowed: usersAllowed,
			groupsAllowed: groupsAllowed
		}).then(function successCallback(res) {
			if (vm.runningContest.fileProblem) {
				Upload.upload({
					url: '/api/contest/editProblemFile',
					data: {
						id: vm.runningContest.id,
						file: vm.runningContest.fileProblem
					}
				}).then(function successCallback(res) {
					vm.showSpinnerTest = false;
					vm.runningContest.filePath = res.data.filePath;
					swal("Thành công!", "Bạn đã chỉnh sửa thông tin kì thi", "success");
					$state.reload();
				}, function errorCallback(err) {
					console.log(err);
				});
			}
			else {
				vm.showSpinnerTest = false;
				swal("Thành công!", "Bạn đã chỉnh sửa thông tin kì thi", "success");
				$state.reload();
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
				// console.log(res);
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
			$http.post('/api/contest/deleteContest', { id: vm.runningContest.id }).then(function successCallback(res) {
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
				vm.showSpinner = false;
				swal("Thất bại!", err.data, "warning");
			});
		}
		else {
		}
	}

	vm.uploadTest = function(file) {
		uploadingTest = true;
		Upload.upload({
			url: '/api/contest/addTest',
			data: {
				file: file
			}
		}).then(function successCallback(res) {
			vm.uploadTestPercent = 100;
			vm.problems = [];
			res.data.problems.forEach(function(problem) {
				vm.problems.push({ 
					name: problem,
					testScore: 1,
					timeLimit: 1,
					memoryLimit: 1024
				});
			});
		}, function errorCallback(err) {
			uploadingTest = false;
			vm.fileTest = null;
			vm.uploadTestPercent = 0;
			if (err.data != "FILE NULL") {
				swal("Thất bại!", "Có lỗi xảy ra. 1. Có thể có bài vẫn còn đang chấm. 2. Có thể format của file test không đúng với yêu cầu.", "warning");
			}
		}, function update(evt) {
			vm.uploadTestPercent = Math.min(99, parseInt(100.0 * evt.loaded / evt.total));
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

	vm.getNumberOfPage = function() {
		let N = vm.contests.length;
		let res = Math.floor(N / 10);
		if (N % 10 > 0)
			res += 1;
		return new Array(res);
	}

	vm.getShownContests = function() {
		let startIdx = (vm.pageIndex - 1) * 10;
		let endIdx = Math.min(startIdx + 9, vm.contests.length);
		let array = vm.contests.slice(startIdx, endIdx + 1);
		return array;
	}

	vm.isAtLastPage = function() {
		let N = vm.contests.length;
		let res = Math.floor(N / 10);
		if (N % 10 > 0)
			res += 1;
		if (vm.pageIndex == res)
			return true;
		return false;
	}

	vm.basePageIndex = function() {
		let res = (vm.pageIndex - 1) * 10;
		return res;
	}

	vm.goToPage = function(idx) {
		vm.pageIndex = idx;
	}

	vm.goToNextOrPrevPage = function(idx) {
		if (vm.isAtLastPage() && idx == 1)
			return;
		if (vm.pageIndex == 1 && idx == -1)
			return;
		vm.pageIndex += idx;
	}

	vm.onUserSubmissionLogs = function(username, idx) {
		vm.showCode = false;
		let problem = vm.runningContest.problems[idx].name;
		// console.log(username, problem);

		vm.userSubmissionLogs = [];
		vm.userSubmissionLogsLoaded = false;
		$http.post('/api/getSubmissionLogs/names', { username: username, problem: problem }).then(function success(data) {
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
		$http.post('/api/getSubmissionLogs/code', { username: username, problem: problem, timeStamp: timeStamp }).then(function success(data) {
			vm.codeRequested = false;
			vm.showCode = true;
			data = data.data;
			vm.userSubmissionCode = data;
		}, function error(err) {
			console.log(err);
		});
	}

	vm.selectIndividual = function(isIndividual) {
		vm.individualSelection = isIndividual;
	}

	vm.toggleAllowUser = function(user) {
		let pos = usersAllowed.indexOf(user.username);
        if (pos > -1) {
        	user.isAllowed = false;
            usersAllowed.splice(pos, 1);
        }
        else {
        	user.isAllowed = true;
            usersAllowed.push(user.username);
        }
        console.log(usersAllowed);
	}
	vm.toggleAllowGroup = function(group) {
		let pos = groupsAllowed.indexOf(group.name);
        if (pos > -1) {
        	group.isAllowed = false;
            groupsAllowed.splice(pos, 1);
        }
        else {
        	group.isAllowed = true;
            groupsAllowed.push(group.name);
        }
        console.log(groupsAllowed);
	}
	vm.showHideAllowToggle = function() {
		if (vm.showHideAllow) {
			vm.showHideAllow = false;
		} else {
			vm.showHideAllow = true;
		}
	}
	vm.toggleChooseAllUsers = function() {
		vm.chooseAllUsers = !vm.chooseAllUsers;
		usersAllowed = [];

		if (vm.chooseAllUsers) {
			for (let i = 0; i < vm.users.length; i += 1) {
				vm.users[i].isAllowed = true;
				usersAllowed.push(vm.users[i].username);
			}
		}
		else {
			for (let i = 0; i < vm.users.length; i += 1) {
				vm.users[i].isAllowed = false;
			}
		}
        console.log(usersAllowed);
	}
	vm.toggleChooseAllGroups = function() {
		vm.chooseAllGroups = !vm.chooseAllGroups;
		groupsAllowed = [];

		if (vm.chooseAllGroups) {
			for (let i = 0; i < vm.groups.length; i += 1) {
				vm.groups[i].isAllowed = true;
				groupsAllowed.push(vm.groups[i].name);
			}
		}
		else {
			for (let i = 0; i < vm.groups.length; i += 1) {
				vm.groups[i].isAllowed = false;
			}
		}
        console.log(groupsAllowed);
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