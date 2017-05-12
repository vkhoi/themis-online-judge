themisApp.controller('HomeController', ['$scope', '$state', '$http', 'AuthService', 'Session', 'Upload', function($scope, $state, $http, AuthService, Session, Upload) {
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

themisApp.filter('submissionResultFilter', function() {
	return function(input) {
		if (input == -1) return "Đang chấm";
		return input.toFixed(2);
	}
});