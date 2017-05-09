// Authentication Service that is used accross the app.
// Allows logging in, checking if user is authenticated, validating if user is
// authorized for specific operations.

themisApp.factory('AuthService', ['$http', 'Session', function($http, Session) {
	var authService = {};

	// Log in.
	authService.login = function(credentials) {
		// Post user's credentials data to API.
		return $http
			.post('/api/login', credentials)
			.then(function successCallback(res) {
				console.log(res);
				Session.create(res.data.user.username, res.data.user.userRole);
				return res.data.user;
			});;
	}

	// Check if session is authenticated.
	authService.isAuthenticated = function() {
		return !!Session.username;
	}

	// Check if session is authorized for an operation.
	// The operation is only allowed for roles that are stored in array authorizedRoles.
	authService.isAuthorized = function(authorizedRoles) {
    	if (!angular.isArray(authorizedRoles)) {
      		authorizedRoles = [authorizedRoles];
    	}
    	return (authService.isAuthenticated() 
    		&& authorizedRoles.indexOf(Session.userRole) !== -1);
  	};

	return authService;
}]);