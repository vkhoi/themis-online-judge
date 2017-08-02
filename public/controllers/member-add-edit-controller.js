themisApp.controller('MemberAddEditController', ['$state', '$scope', '$http', 'AuthService', function($state, $scope, $http, AuthService) {
	var vm = this;
	vm.pageName = "";
	vm.addEditBtnName = "";

	vm.username = "";
	vm.password = "";
	vm.name = "";
	vm.role = "";
	vm.info = "";

	vm.isUsernameDisabled = false;

	var isAdd = true;

	// Variable to show/hide spinner.
	vm.showSpinner = false;

	function init() {
		if ($state.current.name == "home.memberEdit") {
			isAdd = false;
			vm.isUsernameDisabled = true;
			vm.pageName = "Chỉnh sửa thành viên";
			vm.addEditBtnName = "Chỉnh sửa";
			$http.post('/api/users/getUser', { username: $state.params.username }).then(function successCallback(res) {
				vm.username = $state.params.username;
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
		else {
			isAdd = true;
			vm.pageName = "Thêm thành viên";
			vm.addEditBtnName = "Thêm thành viên";
		}
	}
	init();

	vm.addEditMember = function() {
		if (vm.username == "" || vm.name == "" || vm.role == "") {
			swal("Thất bại!", "Tên tài khoản, họ và tên, quyền hạn không được để trống", "warning");
			return;
		}
		vm.showSpinner = true;
		if (isAdd) {
			$http.post('/api/users/add', { username: vm.username, name: vm.name, role: vm.role, info: vm.info }).then(function successCallback(res) {
				vm.showSpinner = false;
				swal({
					title: "Thành công!",
					text: "Đã thêm thành viên mới!",
					type: "success",
				}, function() {
					$state.go('home.members');
				});
			}, function errorCallback(err) {
				vm.showSpinner = false;
				swal({
					title: "Lỗi!",
					text: err.data,
					type: "error",
					confirmButtonText: "Đóng"
				});
			});
		}
		else {
			$http.post('/api/users/edit', { username: vm.username, password: vm.password, name: vm.name, role: vm.role, info: vm.info }).then(function successCallback(res) {
				vm.showSpinner = false;
				swal({
					title: "Thành công!",
					text: "Thông tin thành viên đã được chỉnh sửa!",
					type: "success",
				}, function() {
					$state.go('home.members');
				});
			}, function errorCallback(err) {
				vm.showSpinner = false;
				swal({
					title: "Lỗi!",
					text: "Không thể chỉnh sửa thông tin thành viên! Hệ thống đang bị lỗi!",
					type: "error",
					confirmButtonText: "Đóng"
				});
			});
		}
	}
}]);