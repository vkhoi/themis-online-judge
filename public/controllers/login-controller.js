themisApp.controller('LoginController', ['$rootScope', '$scope', '$state', 'AUTH_EVENTS', 'AuthService', 'Session', function($rootScope, $scope, $state, AUTH_EVENTS, AuthService) {
	var vm = this;

	vm.credentials = {
		username: '',
		password: ''
	};

	vm.showSpinner = false;

	vm.login = function(credentials) {
		vm.showSpinner = true;
		AuthService.login(credentials).then(function(user) {
			vm.showSpinner = false;
			$state.go('home.contest.all');
		}, function() {
			vm.showSpinner = false;
			console.log('Login Controller', 'login failed');
			swal({
				title: "Không thể đăng nhập!",
				text: "Mật khẩu không đúng hoặc tài khoản này không tồn tại.",
				type: "error",
				confirmButtonText: "Đóng"
			});
		});
	}
}]);