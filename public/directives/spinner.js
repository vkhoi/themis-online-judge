themisApp.directive('spinner', [function() {
	return {
		restrict: 'EA',
		scope: {
		},
		replace: true,
		transclude: true,
		templateUrl: 'html/spinner.html',
		link: function(scope, element, attrs) {
			var windowHeight = $(window).height();
			var spinnerHeight = $('#spinner .spinner-icon').height();
			$('#spinner .spinner-icon').css('top', (windowHeight - spinnerHeight) / 2);

			$('#spinner .spinner-panel').css('height', windowHeight);
		}
	};
}]);