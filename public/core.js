var themisApp = angular.module('themisApp', ['ui.router', 'ngStorage', 'ngFileUpload', 'textAngular', 'moment-picker', 'timer']);

themisApp.constant('AUTH_EVENTS', {
	loginSuccess: 'auth-login-success',
	loginFailed: 'auth-login-failed',
  	logoutSuccess: 'auth-logout-success',
  	sessionTimeout: 'auth-session-timeout',
  	notAuthenticated: 'auth-not-authenticated',
  	notAuthorized: 'auth-not-authorized'
});

themisApp.constant('USER_ROLES', {
	admin: 'admin',
	contestant: 'contestant'
});

themisApp.config(function($stateProvider, $locationProvider, $urlRouterProvider, $httpProvider, $provide, USER_ROLES) {
	$stateProvider
		.state('login', {
			url: '/login',
			controller: 'LoginController',
			controllerAs: 'LoginCtrl',
			templateUrl: 'html/login.html'
		})
		.state('home', {
			url: '/',
			controller: 'HomeController',
			controllerAs: 'HomeCtrl',
			templateUrl: 'html/home.html',
			redirectTo: 'home.contest.scoreboard'
		})
			.state('home.posts', {
				url: 'posts/all',
				controller: 'PostsController',
				controllerAs: 'PostsCtrl',
				templateUrl: 'html/posts.html'
			})
			.state('home.postDetail', {
				url: 'posts/detail/:id',
				controller: 'PostDetailController',
				controllerAs: 'PostDetailCtrl',
				templateUrl: 'html/post-detail.html'
			})
			.state('home.postsAdmin', {
				url: 'posts/admin',
				controller: 'PostsAdminController',
				controllerAs: 'PostsAdminCtrl',
				templateUrl: 'html/posts-admin.html',
				data: {
					authorizedRoles: [USER_ROLES.admin],
					redirectTo: 'home.posts'
				}
			})
			.state('home.postAdd', {
				url: 'posts/admin/add',
				controller: 'PostAddEditController',
				controllerAs: 'PostAddEditCtrl',
				templateUrl: 'html/post-add-edit.html',
				data: {
					authorizedRoles: [USER_ROLES.admin],
					redirectTo: 'home.posts'
				}
			})
			.state('home.postEdit', {
				url: 'posts/admin/edit/:id',
				controller: 'PostAddEditController',
				controllerAs: 'PostAddEditCtrl',
				templateUrl: 'html/post-add-edit.html',
				data: {
					authorizedRoles: [USER_ROLES.admin],
					redirectTo: 'home.posts'
				}
			})
			.state('home.contest', {
				url: 'contest',
				controller: 'ContestController',
				controllerAs: 'ContestCtrl',
				templateUrl: 'html/contest.html'
			})
				.state('home.contest.admin', {
					url: '/admin',
					templateUrl: 'html/admin.html',
					data: {
						authorizedRoles: [USER_ROLES.admin],
						redirectTo: 'home.contest.scoreboard'
					}
				})
				.state('home.contest.all', {
					url: '/all',
					templateUrl: 'html/all-contests.html'
				})
				.state('home.contest.scoreboard', {
					url: '/scoreboard',
					templateUrl: 'html/scoreboard.html'
				})
				.state('home.contest.submission', {
					url: '/submission',
					templateUrl: 'html/submission.html'
				})
				.state('home.contest.archiveScoreboard', {
					url: '/archive/scoreboard/:id',
					controller: 'ContestArchiveScoreboardController',
					controllerAs: 'ContestArchiveScoreboardCtrl',
					templateUrl: 'html/archive-scoreboard.html'
				})
			.state('home.members', {
				url: 'members',
				controller: 'MembersController',
				controllerAs: 'MembersCtrl',
				templateUrl: 'html/members.html',
				data: {
					authorizedRoles: [USER_ROLES.admin],
					redirectTo: 'home.contest.scoreboard'
				}
			})
			.state('home.memberEdit', {
				url: 'members/edit/:username',
				controller: 'MemberAddEditController',
				controllerAs: 'MemberAddEditCtrl',
				templateUrl: 'html/member-add-edit.html',
				data: {
					authorizedRoles: [USER_ROLES.admin],
					redirectTo: 'home.contest.scoreboard'
				}
			})
			.state('home.memberAdd', {
				url: 'members/add',
				controller: 'MemberAddEditController',
				controllerAs: 'MemberAddEditCtrl',
				templateUrl: 'html/member-add-edit.html',
				data: {
					authorizedRoles: [USER_ROLES.admin],
					redirectTo: 'home.contest.scoreboard'
				}
			})
			.state('home.account', {
				url: 'account',
				controller: 'AccountController',
				controllerAs: 'AccountCtrl',
				templateUrl: 'html/account.html'
			})
			.state('home.groups', {
				url: 'groups',
				controller: 'GroupsController',
				controllerAs: 'GroupsCtrl',
				templateUrl: 'html/groups.html',
				data: {
					authorizedRoles: [USER_ROLES.admin],
					redirectTo: 'home.contest.scoreboard'
				}
			})
			.state('home.groupCreate', {
				url: 'groups/create',
				controller: 'GroupAddEditController',
				controllerAs: 'GroupAddEditCtrl',
				templateUrl: 'html/group-add-edit.html',
				data: {
					authorizedRoles: [USER_ROLES.admin],
					redirectTo: 'home.contest.scoreboard'
				}
			})
			.state('home.groupEdit', {
				url: 'groups/edit/:id',
				controller: 'GroupAddEditController',
				controllerAs: 'GroupAddEditCtrl',
				templateUrl: 'html/group-add-edit.html',
				data: {
					authorizedRoles: [USER_ROLES.admin],
					redirectTo: 'home.contest.scoreboard'
				}
			})

	$locationProvider.html5Mode(true);

	$provide.factory('AuthInterceptor', ['$rootScope', '$q', '$localStorage', 'AUTH_EVENTS', function($rootScope, $q, $localStorage, AUTH_EVENTS) {
		return {
			request: function(request) {
				request.headers = request.headers || {};
				if ($localStorage.token) {
					request.headers.Authorization = 'Bearer ' + $localStorage.token;
				}
				return request;
			},
			responseError: function(response) {
				$rootScope.$broadcast({
					401: AUTH_EVENTS.notAuthenticated,
					403: AUTH_EVENTS.notAuthorized
				}[response.status], response);
				return $q.reject(response);
			}
		};
	}]);
	$httpProvider.interceptors.push('AuthInterceptor');

	$provide.decorator('taOptions', ['taRegisterTool', '$delegate', function(taRegisterTool, taOptions) { 
        taOptions.toolbar = [['h1', 'h2', 'h3', 'h4', 'p'], ['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo'], ['justifyLeft', 'justifyCenter', 'justifyRight'], ['insertImage']];
        return taOptions;
    }]);
});

themisApp.run(function($transitions, $rootScope, $q, AUTH_EVENTS) {
	$transitions.onStart({ to: 'home.**'}, function(trans) {
		var AuthService = trans.injector().get('AuthService');

		return AuthService.isAuthenticated().then(function(isAuthenticated) {
			if (!isAuthenticated) {
				$rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
    			return trans.router.stateService.target('login');
			}
			if (trans.to().data) {
				var authorizedRoles = trans.to().data.authorizedRoles;
				if (!AuthService.isAuthorized(authorizedRoles)) {
					var redirectTo = trans.to().data.redirectTo;
					return trans.router.stateService.target(redirectTo);
				}
			}
		});
	});

	$transitions.onStart({ to: 'login'}, function(trans) {
		var AuthService = trans.injector().get('AuthService');

		return AuthService.isAuthenticated().then(function(isAuthenticated) {
			if (isAuthenticated) {
    			return trans.router.stateService.target('home.contest.scoreboard');
			}
		});
	});
});

themisApp.directive('selectOnClick', ['$window', function ($window) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.on('click', function () {
                if (!$window.getSelection().toString()) {
                    // Required for mobile Safari
                    this.setSelectionRange(0, this.value.length)
                }
            });
        }
    };
}]);