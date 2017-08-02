themisApp.controller('PostsController', ['$state', '$scope', '$http', 'AuthService', 'Session', function($state, $scope, $http, AuthService, Session) {

	var vm = this;
	vm.posts = [];

	vm.pageIndex = 1;

	var NUMBER_OF_POSTS = 5;

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
			if (err.status == 403) {
				AuthService.resetAuthentication();
				$state.go('login');
			}
		});
	}
	init();

	vm.isAdmin = function() {
		return Session.userRole == "admin";
	}

	vm.getNumberOfPage = function() {
		let N = vm.posts.length;
		let res = Math.floor(N / NUMBER_OF_POSTS);
		if (N % NUMBER_OF_POSTS > 0)
			res += 1;
		return new Array(res);
	}

	vm.getShownPosts = function() {
		let startIdx = (vm.pageIndex - 1) * NUMBER_OF_POSTS;
		let endIdx = Math.min(startIdx + NUMBER_OF_POSTS - 1, vm.posts.length);
		let array = vm.posts.slice(startIdx, endIdx + 1);
		return array;
	}

	vm.isAtLastPage = function() {
		let N = vm.posts.length;
		let res = Math.floor(N / NUMBER_OF_POSTS);
		if (N % NUMBER_OF_POSTS > 0)
			res += 1;
		if (vm.pageIndex == res)
			return true;
		return false;
	}

	vm.goToPage = function(idx) {
		vm.pageIndex = idx;
	}

	vm.goToNextOrPrevPage = function(idx) {
		if (vm.isAtLastPage() && idx == 1)
			return;
		if (vm.pageIndex == 1 && idx == -1)
			return;
		vm.pageIndex += idx;
	}
}]);