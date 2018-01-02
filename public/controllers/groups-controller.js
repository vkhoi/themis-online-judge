themisApp.controller('GroupsController', ['$state', '$scope', '$http', 'AuthService', function($state, $scope, $http, AuthService) {
    var vm = this;
    vm.groups = [];

    function init() {
        $http.get('/api/groups/getAllGroups').then(function successCallback(res) {
            vm.groups = res.data;
        }, function errorCallback(err) {
            if (err.status == 403) {
                AuthService.resetAuthentication();
                $state.go('login');
            }
        });
    }
    init();

    vm.removeGroup = function(index) {
        swal({
            title: "Bạn có chắc muốn xóa nhóm này không?",
            text: "Thông tin nhóm này sẽ không thể khôi phục lại được sau khi xóa!",
            type: "warning",
            showCancelButton: true,
            cancelButtonText: "Hủy",
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Vâng, tôi muốn xóa",
            closeOnConfirm: false
        }, function() {
            $http.post('/api/groups/remove', { _id: vm.groups[index]._id }).then(function successCallback(res) {
                swal({
                    title: "Thành công!",
                    text: "Nhóm đã được xóa!",
                    type: "success",
                }, function() {
                    vm.groups.splice(index, 1);
                    if (!$scope.$$phase)
                        $scope.$apply();
                });
            }, function errorCallback(err) {
                swal({
                    title: "Lỗi!",
                    text: "Không thể tiến hành xóa thông tin nhóm! Hệ thống đang bị lỗi!",
                    type: "error",
                    confirmButtonText: "Đóng"
                });
            });
        });
    }
}]);