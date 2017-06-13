themisApp.controller('PostsAddEditController', ['$state', '$scope', '$http', 'Session', function($state, $scope, $http, Session) {
	var vm = this;

	vm.pageName = "";
	vm.addEditBtnName = "";

	vm.title = "";
	vm.shorttext = "";
	vm.content = "";
	vm.author = "";

	var isAdd = true;
	var titleLostFocus = false;

	function init() {
		if ($state.current.name == "home.postsAdd") {
			isAdd = true;
			vm.pageName = "Thêm bài viết mới";
			vm.addEditBtnName = "Thêm bài";
		}
		else {
			isAdd = false;
			vm.pageName = "Chỉnh sửa bài viết";
			vm.addEditBtnName = "Chỉnh sửa";
				$http.post('/api/posts/getPost', { id: $state.params.id }).then(function successCallback(res) {
				vm.title = res.data.title;
				vm.shorttext = res.data.shorttext;
				vm.content = res.data.content;
				vm.author = res.data.author;
			}, function errorCallback(err) {
				swal({
					title: "Lỗi!",
					text: "Không thể tìm thấy bài viết với ID này!",
					type: "error",
					confirmButtonText: "Trở lại"
				}, function() {
					$state.go('home.postsAdmin');
				});
			});
		}
	}
	init();

	vm.isTitleEmpty = function() {
		if (!titleLostFocus) return false;
		while (vm.title && vm.title.length > 0 && vm.title[vm.title.length-1] == ' ') {
			vm.title = vm.title.slice(0, -1);
		}
		return !vm.title || vm.title.length == 0;
	}

	vm.titleLostFocus = function() {
		titleLostFocus = true;
	}

	vm.addEditPost = function() {
		if (!vm.title || vm.title.length == 0) {
			swal({
				title: "Lỗi!",
				text: "Tên bài viết không được rỗng!",
				type: "error",
				confirmButtonText: "Đóng"
			});
		}
		else if (isAdd) {
			$http.post('/api/posts/add', { title: vm.title, author: Session.username, shorttext: vm.shorttext, content: vm.content }).then(function successCallback(res) {
				swal({
					title: "Thành công!",
					text: "Bài mới đã được thêm vào!",
					type: "success",
				}, function() {
					$state.go('home.postsAdmin');
				});
			}, function errorCallback(err) {
				swal({
					title: "Lỗi!",
					text: "Không thể thêm bài viết mới! Hệ thống đang bị lỗi!",
					type: "error",
					confirmButtonText: "Đóng"
				});
			});
		}
		else {
			$http.post('/api/posts/edit', { id: $state.params.id, title: vm.title, shorttext: vm.shorttext, content: vm.content }).then(function successCallback(res) {
				swal({
					title: "Thành công!",
					text: "Bài viết đã được chỉnh sửa!",
					type: "success",
				}, function() {
					$state.go('home.postsAdmin');
				});
			}, function errorCallback(err) {
				swal({
					title: "Lỗi!",
					text: "Không thể chỉnh sửa bài viết! Hệ thống đang bị lỗi!",
					type: "error",
					confirmButtonText: "Đóng"
				});
			});
		}
	}
}]);