themisApp.controller('HomeController', ['$scope', '$state', 'AuthService', 'Session', function($scope, $state, AuthService, Session) {
	var vm = this;

	vm.init = function() {
		vm.username = Session.username;
	}
	vm.init();

	vm.logout = function() {
		AuthService.logout().then(function() {
			$state.go('login');
		});
	}
}]);