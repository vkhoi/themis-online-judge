themisApp.controller('PostsController', ['$state', '$scope', '$http', 'AuthService', function($state, $scope, $http, AuthService) {

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
		$http.get('/api/posts/getAllPosts').then(function successCallback(res) {
			vm.posts = res.data;
			vm.posts.forEach(function(post) {
				post.date = timeToDate(post.date);
			});
		}, function errorCallback(err) {
			console.log(err);
			if (err.status == 403) {
				AuthService.resetAuthentication();
				$state.go('login');
			}
		});
	}
	init();
}]);