themisApp.controller('GroupAddEditController', ['$state', '$scope', '$http', 'AuthService', function($state, $scope, $http, AuthService) {
    var vm = this;
    vm.pageName = "";
    vm.addEditBtnName = "";

    vm._id = "";
    vm.name = "";
    vm.info = "";
    vm.members = [];

    vm.users = [];

    var isCreate = true;

    // Variable to show/hide spinner.
    vm.showSpinner = false;

    function init() {
        $http.get('/api/users/getAllUsers').then(function successCallback(res) {
            vm.users = res.data;
        }, function errorCallback(err) {
            if (err.status == 403) {
                AuthService.resetAuthentication();
                $state.go('login');
            }
        });
        if ($state.current.name == "home.groupEdit") {
            isCreate = false;
            vm._id = $state.params.id;
            vm.pageName = "Chỉnh sửa nhóm";
            vm.addEditBtnName = "Chỉnh sửa";
            $http.post('/api/groups/getGroup', { _id: $state.params.id }).then(function successCallback(res) {
                vm.name = res.data.name;
                vm.info = res.data.info;
                vm.members = res.data.members;
            }, function errorCallback(err) {
                swal({
                    title: "Lỗi!",
                    text: "Không thể tìm thấy nhóm này!",
                    type: "error",
                    confirmButtonText: "Trở lại"
                }, function() {
                    $state.go('home.groups');
                });
            });
        }
        else {
            isCreate = true;
            vm.pageName = "Thêm nhóm";
            vm.addEditBtnName = "Thêm nhóm";
        }
    }
    init();

    vm.addEditGroup = function() {
        if (vm.name == "") {
            swal("Thất bại!", "Tên nhóm không được để trống", "warning");
            return;
        }
        vm.showSpinner = true;
        if (isCreate) {
            $http.post('/api/groups/create', { name: vm.name, info: vm.info, members: vm.members }).then(function successCallback(res) {
                vm.showSpinner = false;
                swal({
                    title: "Thành công!",
                    text: "Đã thêm nhóm mới!",
                    type: "success",
                }, function() {
                    $state.go('home.groups');
                });
            }, function errorCallback(err) {
                vm.showSpinner = false;
                swal({
                    title: "Lỗi!",
                    text: err.data,
                    type: "error",
                    confirmButtonText: "Đóng"
                });
            });
        }
        else {
            $http.post('/api/groups/edit', { _id: vm._id, name: vm.name, info: vm.info, members: vm.members }).then(function successCallback(res) {
                vm.showSpinner = false;
                swal({
                    title: "Thành công!",
                    text: "Thông tin nhóm đã được chỉnh sửa!",
                    type: "success",
                }, function() {
                    $state.go('home.groups');
                });
            }, function errorCallback(err) {
                vm.showSpinner = false;
                swal({
                    title: "Lỗi!",
                    text: "Không thể chỉnh sửa thông tin nhóm! Hệ thống đang bị lỗi!",
                    type: "error",
                    confirmButtonText: "Đóng"
                });
            });
        }
    }

    vm.toggleMember = function(username) {
        let pos = vm.members.indexOf(username);
        if (pos > -1) {
            vm.members.splice(pos, 1);
        }
        else {
            vm.members.push(username);
        }
    }

    vm.isUserInGroup = function(username) {
        // console.log(username);
        return vm.members.indexOf(username) > -1;
    }
}]);