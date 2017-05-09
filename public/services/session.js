themisApp.service('Session', [function() {
	this.create = function(username, userRole) {
	    this.username = username;
	    this.userRole = userRole;
	    console.log('Session', this.username, this.userRole);
	};
  	this.destroy = function() {
	    this.username = null;
	    this.userRole = null;
  	};
}]);