themisApp.controller('PostDetailController', ['$state', '$scope', '$http', function($state, $scope, $http) {
	
	var vm = this;

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
		$http.post('/api/posts/getPost', { id: $state.params.id }).then(function successCallback(res) {
			vm.title = res.data.title;
			vm.shorttext = res.data.shorttext;
			vm.content = res.data.content;
			vm.author = res.data.author;
			vm.date = timeToDate(res.data.date);
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
	init();
}]);

themisApp.filter('unsafe', function($sce) {
	return function(val) {
		return $sce.trustAsHtml(val);
	}
});