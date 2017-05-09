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
	all: '*',
	admin: 'admin',
	contestant: 'contestant'
});

themisApp.config(function($stateProvider, $locationProvider, $urlRouterProvider, $httpProvider, $provide) {
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