themisApp.controller('LoginController', ['$rootScope', '$scope', '$state', 'AUTH_EVENTS', 'AuthService', function($rootScope, $scope, $state, AUTH_EVENTS, AuthService) {
	var vm = this;

	vm.credentials = {
		username: '',
		password: ''
	};

	vm.login = function(credentials) {
		AuthService.login(credentials).then(function(user) {
			console.log('Login Controller', 'login success');
			$state.go('home.problems');
		}, function() {
			console.log('Login Controller', 'login failed');
		});
	}
}]);