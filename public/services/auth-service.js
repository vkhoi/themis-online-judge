// Authentication Service that is used accross the app.
// Allows logging in, checking if user is authenticated, validating if user is
// authorized for specific operations.

themisApp.factory('AuthService', ['$http', '$localStorage', '$timeout', 'Session', function($http, $localStorage, $timeout, Session) {
	var authService = {};

	// Log in.
	authService.login = function(credentials) {
		// Post user's credentials data to API.
		return $http
			.post('/api/login', credentials)
			.then(function successCallback(res) {
				Session.create(res.data.user.username, res.data.user.userRole);
				$localStorage.token = res.data.user.token;
				return res.data.user;
			});;
	}

	// Log out.
	authService.logout = function() {
		return $http
			.post('/api/logout', { token: $localStorage.token })
			.then(function successCallback(res) {
				Session.destroy();
				delete $localStorage.token;
			});
	}

	// Check if session is authenticated.
	authService.isAuthenticated = function() {
		if (!Session.username) {
			if ($localStorage.token) {
				return $http
					.post('/api/login', { token: $localStorage.token })
					.then(function successCallback(res) {
						// Session is alive -> create session.
						Session.create(res.data.user.username, res.data.user.userRole);
						return true;
					}, function errorCallback(res) {
						// Session is expired -> delete token in local storage.
						delete $localStorage.token;
						return false;
					});
			}
			else {
				// This looks stupid. But $timeout returns a promise and we really need a
				// promise here.
				return $timeout(function() {
					return false;
				}, 100);
			}
		}
		else {
			return new Promise(function(resolve, reject) {
				resolve(true);
			});
		}
	}

	// Check if session is authorized for an operation.
	// The operation is only allowed for roles that are stored in array authorizedRoles.
	authService.isAuthorized = function(authorizedRoles) {
		if (!authorizedRoles)
			return true;
    	if (!angular.isArray(authorizedRoles)) {
      		authorizedRoles = [authorizedRoles];
    	}
    	return authorizedRoles.indexOf(Session.userRole) !== -1;
  	};

  	authService.resetAuthentication = function() {
  		Session.destroy();
  	}

	return authService;
}]);