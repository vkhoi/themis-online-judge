themisApp.controller('ContestArchiveScoreboardController', ['$state', '$scope', '$http', function($state, $scope, $http) {
	var vm = this;

	vm.isNotFinal = false;

	function init() {
		$http.post('/api/getProblems', { id: $state.params.id }).then(function successCallback(res) {
			vm.problems = res.data.problems;
			$http.post('/api/getScoreboard', { id: $state.params.id, archived: "true" } ).then(function successCallback(res) {
				vm.isNotFinal = res.data.isNotFinal;
				vm.scoreboard = [];
				var scoreboard = res.data.scoreboard;
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
}]);