themisApp.controller('PostsController', ['$state', '$scope', '$http', function($state, $scope, $http) {

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
			console.log(res);
			vm.posts = res.data;
			vm.posts.forEach(function(post) {
				post.date = timeToDate(post.date);
			});
		}, function errorCallback(err) {
			console.log(err);
		});
	}
	init();
}]);

themisApp.filter('unsafe', function($sce) {
	return function(val) {
		return $sce.trustAsHtml(val);
	}
});