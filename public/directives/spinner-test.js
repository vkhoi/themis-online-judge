themisApp.directive('spinnerTest', [function() {
	return {
		restrict: 'EA',
		scope: {
		},
		templateUrl: 'html/spinner-test.html',
		link: function(scope, element, attrs) {
			var windowHeight = $(window).height();
			var spinnerHeight = $('.spinner .spinner-icon').height();
			var cardHeight = $('.spinner .card').height();
			$('.spinner .spinner-main').css('top', (windowHeight - spinnerHeight - cardHeight) / 2);

			$('.spinner .spinner-panel').css('height', windowHeight);
		}
	};
}]);