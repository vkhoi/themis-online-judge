var themisApp = angular.module('themisApp', ['ui.router', 'ngStorage', 'ngFileUpload']);

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
			abstract: true,
			url: '',
			controller: 'HomeController',
			controllerAs: 'HomeCtrl',
			templateUrl: 'html/home.html',
			data: {
				authorizedRoles: [USER_ROLES.admin, USER_ROLES.contestant]
			}
		})
			.state('home.scoreboard', {
				url: '/scoreboard',
				templateUrl: 'html/scoreboard.html'
			})
			.state('home.submission', {
				url: '/submission',
				templateUrl: 'html/submission.html'
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
});

themisApp.run(function($transitions, $rootScope, AUTH_EVENTS) {
	$transitions.onStart({ to: 'home.**'}, function(trans) {
		// var authorizedRoles = trans.to().data.authorizedRoles;
		var AuthService = trans.injector().get('AuthService');

		return AuthService.isAuthenticated().then(function(isAuthenticated) {
			if (!isAuthenticated) {
				$rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
    			return trans.router.stateService.target('login');
			}
		});
	});

	$transitions.onStart({ to: 'login'}, function(trans) {
		var AuthService = trans.injector().get('AuthService');

		return AuthService.isAuthenticated().then(function(isAuthenticated) {
			if (isAuthenticated) {
    			return trans.router.stateService.target('home.scoreboard');
			}
		});
	});
});