themisApp.controller('MemberAddEditController', ['$state', '$scope', '$http', 'AuthService', function($state, $scope, $http, AuthService) {
	var vm = this;
	vm.pageName = "";
	vm.addEditBtnName = "";

	vm.username = "";
	vm.password = "";
	vm.name = "";
	vm.role = "";

	vm.isUsernameDisabled = false;

	var isAdd = true;

	function init() {
		if ($state.current.name == "home.memberEdit") {
			isAdd = false;
			vm.isUsernameDisabled = true;
			vm.pageName = "Chỉnh sửa thành viên";
			vm.addEditBtnName = "Chỉnh sửa";
			$http.post('/api/users/getUser', { username: $state.params.username }).then(function successCallback(res) {
				console.log(res.data);
				vm.username = $state.params.username;
				vm.password = res.data.password;
				vm.name = res.data.name;
				vm.role = res.data.role;
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
			$http.post('/api/users/edit', { username: vm.username, password: vm.password, name: vm.name, role: vm.role }).then(function successCallback(res) {
				swal({
					title: "Thành công!",
					text: "Thông tin thành viên đã được chỉnh sửa!",
					type: "success",
				}, function() {
					$state.go('home.members');
				});
			}, function errorCallback(err) {
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