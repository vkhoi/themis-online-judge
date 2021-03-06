themisApp.directive('spinner', [function() {
	return {
		restrict: 'EA',
		scope: {
		},
		templateUrl: 'html/spinner.html',
		link: function(scope, element, attrs) {
			var windowHeight = $(window).height();
			var spinnerHeight = $('.spinner .spinner-icon').height();
			$('.spinner .spinner-main').css('top', (windowHeight - spinnerHeight) / 2);

			$('.spinner .spinner-panel').css('height', windowHeight);
		}
	};
}]);