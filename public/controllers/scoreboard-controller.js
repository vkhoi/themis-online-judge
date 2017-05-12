themisApp.controller('ScoreboardController', ['$scope', '$state', '$http', 'AuthService', 'Session', function($scope, $state, $http, AuthService, Session) {

	var vm = this;
	vm.problems = ["SEGMENT", "ANT", "POLYGON"];

	vm.scoreboard = [
		{
			username: "Phạm Việt Khôi",
			scores: [100, 100, 100],
			totalScore: 300
		},
		{
			username: "Phạm Việt Khôi",
			scores: [100, 100, 100],
			totalScore: 300
		},
		{
			username: "Phạm Việt Khôi",
			scores: [100, 100, 100],
			totalScore: 300
		},
		{
			username: "Phạm Việt Khôi",
			scores: [100, 100, 100],
			totalScore: 300
		},
		{
			username: "Phạm Việt Khôi",
			scores: [100, 100, 100],
			totalScore: 300
		}
	];
}]);