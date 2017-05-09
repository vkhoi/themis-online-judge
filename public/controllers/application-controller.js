themisApp.controller('ApplicationController', ['$scope', function($scope) {
	// Use $scope so that child controllers can access currentUser.
	$scope.currentUser = null;

	$scope.setCurrentUser = function(user) {
		vm.currentUser = user;
	}
}]);