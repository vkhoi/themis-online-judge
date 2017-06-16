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

	vm.removeUser = function(index) {
		swal({
			title: "Bạn có chắc muốn xóa thành viên này không?",
			text: "Thông tin thành viên này sẽ không thể khôi phục lại được sau khi xóa!",
			type: "warning",
			showCancelButton: true,
			cancelButtonText: "Hủy",
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "Vâng, tôi muốn xóa",
			closeOnConfirm: false
		}, function() {
			$http.post('/api/users/remove', { username: vm.users[index].username }).then(function successCallback(res) {
				swal({
					title: "Thành công!",
					text: "Thành viên đã được xóa!",
					type: "success",
				}, function() {
					vm.users.splice(index, 1);
					if (!$scope.$$phase)
						$scope.$apply();
				});
			}, function errorCallback(err) {
				swal({
					title: "Lỗi!",
					text: "Không thể tiến hành xóa thông tin thành viên! Hệ thống đang bị lỗi!",
					type: "error",
					confirmButtonText: "Đóng"
				});
			});
		});
	}
}]);