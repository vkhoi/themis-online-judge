themisApp.controller('MemberAddEditController', ['$state', '$scope', '$http', 'AuthService', function($state, $scope, $http, AuthService) {
	var vm = this;
	vm.pageName = "";
	vm.addEditBtnName = "";

	vm.username = "";
	vm.password = "";
	vm.name = "";
	vm.role = "";

	var isAdd = true;

	function init() {
		if ($state.current.name == "home.memberEdit") {
			isAdd = false;
			vm.pageName = "Chỉnh sửa thành viên";
			vm.addEditBtnName = "Chỉnh sửa";
		}
		else {
			isAdd = true;
			vm.pageName = "Thêm thành viên";
			vm.addEditBtnName = "Thêm thành viên";
		}
	}
	init();

	vm.addEditMember = function() {
		if (isAdd) {
			$http.post('/api/users/add', { username: vm.username, password: vm.password, name: vm.name, role: vm.role }).then(function successCallback(res) {
				swal({
					title: "Thành công!",
					text: "Đã thêm thành viên mới!",
					type: "success",
				}, function() {
					$state.go('home.members');
				});
			}, function errorCallback(err) {
				swal({
					title: "Lỗi!",
					text: "Không thể thêm thành viên mới! Hệ thống đang bị lỗi!",
					type: "error",
					confirmButtonText: "Đóng"
				});
			});
		}
		else {

		}
	}
}]);