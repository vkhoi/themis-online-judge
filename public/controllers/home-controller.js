themisApp.controller('HomeController', ['$state', '$scope', 'AuthService', 'Session', function($state, $scope, AuthService, Session) {
	var vm = this;

	vm.showSpinner = false;

	function init() {
		vm.username = Session.username;
	}
	init();

	vm.isTabActive = function(tabName) {
		var stateName = $state.current.name;
		return stateName.indexOf(tabName) != -1;
	}

	vm.selectTab = function(index) {
		if (index == 0) {
			$state.go('home.posts');
		}
		else if (index == 1) {
			$state.go('home.contest.scoreboard');
		}
	}

	vm.logout = function() {
		vm.showSpinner = true;
		AuthService.logout().then(function() {
			vm.showSpinner = false;
			$state.go('login');
		});
	}

	vm.isAdmin = function() {
		return Session.userRole == "admin";
	}
}]);