themisApp.controller('AccountController', ['$state', '$scope', '$http', 'AuthService', 'Session', function($state, $scope, $http, AuthService, Session) {
	var vm = this;

	function init() {
		$http.post('/api/users/getAccount', { username: Session.username }).then(function successCallback(res) {
				vm.username = Session.username;
				vm.password = res.data.password;
				vm.name = res.data.name;
				vm.role = res.data.role;
				vm.info = res.data.info;
			}, function errorCallback(err) {
				swal({
					title: "Lỗi!",
					text: "Không thể tìm thấy thông tin thành viên này!",
					type: "error",
					confirmButtonText: "Trở lại"
				}, function() {
					$state.go('home.members');
				});
			});
	}
	init();

	vm.editAccount = function() {
		vm.showSpinner = true;
		$http.post('/api/users/editAccount', { username: vm.username, password: vm.password, name: vm.name }).then(function successCallback(res) {
			vm.showSpinner = false;
			swal({
				title: "Thành công!",
				text: "Thông tin tài khoản đã được chỉnh sửa!",
				type: "success",
			}, function() {
				$state.go('home.account');
			});
		}, function errorCallback(err) {
			vm.showSpinner = false;
			swal({
				title: "Lỗi!",
				text: "Không thể chỉnh sửa thông tin tài khoản! Hệ thống đang bị lỗi!",
				type: "error",
				confirmButtonText: "Đóng"
			});
		});
	}
}]);