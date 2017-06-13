themisApp.controller('PostsAdminController', ['$state', '$scope', '$http', function($state, $scope, $http) {
	var vm = this;
	vm.posts = [];

	function padNumber(number, L) {
		var res = number.toString();
		while (res.length < L)
			res = "0" + res;
		return res;
	}

	function timeToDate(timeStamp) {
		var d = new Date(timeStamp);
		return padNumber(d.getDate(), 2) + "-" + padNumber(d.getMonth() + 1, 2) + "-" + d.getFullYear();
	}

	function init() {
		$http.get('/api/posts/getAllPosts?noContent=true').then(function successCallback(res) {
			vm.posts = res.data;
			vm.posts.forEach(function(post) {
				post.date = timeToDate(post.date);
			});
		}, function errorCallback(err) {
			console.log(err);
		});
	}
	init();

	vm.removePost = function(index) {
		swal({
			title: "Bạn có chắc muốn xóa bài này không?",
			text: "Bài này sẽ không thể khôi phục lại được sau khi xóa!",
			type: "warning",
			showCancelButton: true,
			cancelButtonText: "Hủy",
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "Vâng, tôi muốn xóa",
			closeOnConfirm: false
		}, function() {
			$http.post('/api/posts/remove', { id: vm.posts[index]._id }).then(function successCallback(res) {
				swal({
					title: "Thành công!",
					text: "Bài viết đã được xóa!",
					type: "success",
				}, function() {
					vm.posts.splice(index, 1);
					if (!$scope.$$phase)
						$scope.$apply();
				});
			}, function errorCallback(err) {
				swal({
					title: "Lỗi!",
					text: "Không thể tiến hành xóa bài! Hệ thống đang bị lỗi!",
					type: "error",
					confirmButtonText: "Đóng"
				});
			});
		});
	}
}]);