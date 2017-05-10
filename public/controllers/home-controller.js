themisApp.controller('HomeController', ['$scope', '$state', 'AuthService', 'Session', function($scope, $state, AuthService, Session) {
	var vm = this;

	var selectedTab = 0;

	vm.init = function() {
		vm.username = Session.username;
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
}]);