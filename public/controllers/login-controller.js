themisApp.controller('LoginController', ['$rootScope', '$scope', '$state', 'AUTH_EVENTS', 'AuthService', function($rootScope, $scope, $state, AUTH_EVENTS, AuthService) {
	var vm = this;

	vm.credentials = {
		username: '',
		password: ''
	};

	vm.login = function(credentials) {
		AuthService.login(credentials).then(function(user) {
			$state.go('home.contest.problems');
		}, function() {
			console.log('Login Controller', 'login failed');
		});
	}
}]);