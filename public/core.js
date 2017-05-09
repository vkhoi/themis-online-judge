var themisApp = angular.module('themisApp', ['ui.router']);

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
		.state('app', {
			abstract: true,
			controller: 'ApplicationController',
			controllerAs: 'AppCtrl'
		})
			.state('app.login', {
				url: '/login',
				controller: 'LoginController',
				controllerAs: 'LoginCtrl',
				templateUrl: 'html/login.html'
			})
			.state('app.auth', {
				url: '/',
				template: 'ahihi do ngok',
				controller: 'HomeController',
				controllerAs: 'HomeCtrl',
				data: {
					authorizedRoles: [USER_ROLES.contestant]
				}
			})

	$locationProvider.html5Mode(true);

	$provide.factory('AuthInterceptor', ['$rootScope', '$q', 'AUTH_EVENTS', function($rootScope, $q, AUTH_EVENTS) {
		return {
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
});

themisApp.run(function($transitions, $rootScope, AUTH_EVENTS) {
	$transitions.onStart({ to: 'app.auth.**'}, function(trans) {
		var authorizedRoles = trans.to().data.authorizedRoles;
		var AuthService = trans.injector().get('AuthService');
    	if (!AuthService.isAuthorized(authorizedRoles)) {
      		if (AuthService.isAuthenticated()) {
        		$rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
      		} else {
        		$rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
        		return trans.router.stateService.target('app.login');
      		}
    	}
	});
});