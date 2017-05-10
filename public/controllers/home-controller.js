themisApp.controller('HomeController', ['$scope', '$state', '$http', 'AuthService', 'Session', 'Upload', function($scope, $state, $http, AuthService, Session, Upload) {
	var vm = this;

	var selectedTab = 1;

	vm.file = null;
	vm.problems = ["SEGMENT", "ANT", "POLYGON"];
	vm.selectedProblem = "SEGMENT";

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

	vm.submit = function() {
		console.log(vm.file.name);
		Upload.upload({
			url: '/api/upload',
			data: {
				username: Session.username,
				problem: vm.selectedProblem,
				file: vm.file
			}
		}).then(function successCallback(res) {
		});
	}

	vm.getSolutionName = function() {
		if (!vm.file) return "Chưa chọn file nào";
		return vm.file.name;
	}
}]);