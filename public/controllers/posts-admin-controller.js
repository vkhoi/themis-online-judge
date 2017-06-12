themisApp.controller('PostsAdminController', ['$state', '$scope', function($state, $scope) {
	var vm = this;
	vm.posts = [
		{
			name: "Quy hoạch động",
			author: "Thầy Hùng",
			date: "07/06/2017"
		},
		{
			name: "Interval Tree",
			author: "Thầy Sơn",
			date: "07/06/2017"
		},
		{
			name: "Luồng cực đại",
			author: "Thầy Nam",
			date: "07/06/2017"
		}
	];
}]);