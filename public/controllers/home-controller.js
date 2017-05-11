themisApp.controller('HomeController', ['$scope', '$state', '$http', 'AuthService', 'Session', 'Upload', function($scope, $state, $http, AuthService, Session, Upload) {
	var vm = this;

	var selectedTab = 1;

	vm.file = null;
	vm.problems = ["SEGMENT", "ANT", "POLYGON"];
	vm.selectedProblem = "SEGMENT";

	vm.submissionLogs = [];

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

	function getSubmissionLogs() {
		$http.post('/api/getSubmissionLogs', { username: vm.username} ).then(function successCallback(res) {
			var scores = res.data.scores;
			Object.keys(scores).forEach(function(key) {
				var timeStamp = key.split('-')[0];
				var score = scores[key];
				var problem = key.split('[').pop();
				problem = problem.slice(0, -1);

				vm.submissionLogs.push({
					time: parseInt(timeStamp),
					problem: problem,
					score: score
				});
			});

			vm.submissionLogs.sort(function(a, b) {
				return b.time - a.time;
			});
			var N = vm.submissionLogs.length;
			for (var i = 0; i < N; i++) {
				vm.submissionLogs[i].id = N - i;
				vm.submissionLogs[i].time = timeToDate(vm.submissionLogs[i].time);
			}
		});
	}

	vm.init = function() {
		vm.username = Session.username;
		getSubmissionLogs();
	}
	vm.init();

	vm.logout = function() {
		AuthService.logout().then(function() {
			$state.go('login');
		});
	}

	vm.isTabActive = function(tabIndex) {
		return selectedTab == tabIndex;
	}

	vm.selectTab = function(tabIndex) {
		selectedTab = tabIndex;
	}

	vm.submit = function() {
		Upload.upload({
			url: '/api/submit',
			data: {
				username: Session.username,
				problem: vm.selectedProblem,
				file: vm.file
			}
		}).then(function successCallback(res) {
			vm.file = null;
		});
	}

	vm.getSolutionName = function() {
		if (!vm.file) return "Chưa chọn file nào";
		return vm.file.name;
	}
}]);