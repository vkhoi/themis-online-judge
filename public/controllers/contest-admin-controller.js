themisApp.controller('ContestAdminController', ['$state', '$scope', '$http', 'AuthService', 'Session', 'Upload', function($state, $scope, $http, AuthService, Session, Upload) {
	var vm = this;
	vm.contestName = "";
	vm.contestTopic = "";
	vm.startTime = "";
	vm.endTime = "";
	vm.uploading = false;

	function isValidTime(startTime, endTime) {
		var start = moment(startTime, "HH:mm, DD/MM/YYYY");
		var end = moment(endTime, "HH:mm, DD/MM/YYYY");
		if (end.isBefore(start)) 
			return false;
		if (start.isBefore(moment()))
			return false;
		return true;
	}

	vm.uploadProblem = function() {
		if (vm.fileProblem == null || vm.contestTopic == "" || vm.startTime == "" || vm.endTime == "") {
			swal("Thất bại!", "Vui lòng điền thời gian thi, chủ đề, tên kì thì, và chọn file đề bài.", "warning");
			return;
		}
		else if (isValidTime(vm.startTime, vm.endTime) == false) {
			swal("Thất bại!", "Thời gian thi không hợp lệ!", "warning");
			return;
		}
		vm.uploading = true;
		console.log('ahihi');
		Upload.upload({
			url: '/api/contest/create',
			data: {
				setter: Session.username,
				name: vm.contestName,
				topic: vm.contestTopic,
				file: vm.fileProblem,
				startTime: vm.startTime,
				endTime: vm.endTime,
			}
		}).then(function successCallback(res) {
			vm.fileProblem = null;
			vm.uploading = false;
			vm.contestName = "";
			vm.contestTopic = "";
			vm.startTime = "";
			vm.endTime = "";
			swal("Thành công!", "Bạn đã tạo kỳ thi.", "success");
			$scope.$parent.ContestCtrl.getContests();
		}, function errorCallback(err) {
			console.log(err);
		});
	}
}]);