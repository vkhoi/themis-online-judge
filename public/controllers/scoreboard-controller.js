themisApp.controller('ScoreboardController', ['$scope', '$state', '$http', 'AuthService', 'Session', function($scope, $state, $http, AuthService, Session) {

	var vm = this;
	vm.problems = [];
	vm.scoreboard = [];

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

	function getProblemsAndScoreboard() {
		$http.post('/api/getProblems').then(function successCallback(res) {
			vm.problems = res.data.problems;
			getScoreboard();
		});
	}

	vm.init = function() {
		getProblemsAndScoreboard();
	}
	vm.init();
}]);