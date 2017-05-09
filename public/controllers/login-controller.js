themisApp.controller('LoginController', ['$rootScope', '$scope', 'AUTH_EVENTS', 'AuthService', function($rootScope, $scope, AUTH_EVENTS, AuthService) {
	var vm = this;

	vm.credentials = {
		username: '',
		password: ''
	};

	vm.login = function(credentials) {
		AuthService.login(credentials).then(function(user) {
			console.log('Login Controller', 'login success');
			$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
			$scope.setCurrentUser(user);
		}, function() {
			console.log('Login Controller', 'login failed');
			$rootScope.$broadcast(AUTH_EVENTS.loginFailed);
		});
		return credentials;
	}
}]);