themisApp.controller('MembersController', ['$state', '$scope', '$http', 'AuthService', function($state, $scope, $http, AuthService) {
	var vm = this;
	vm.users = [];

	function init() {
		$http.get('/api/users/getAllUsers').then(function successCallback(res) {
			vm.users = res.data;
		}, function errorCallback(err) {
			if (err.status == 403) {
				AuthService.resetAuthentication();
				$state.go('login');
			}
		});
	}
	init();
}]);