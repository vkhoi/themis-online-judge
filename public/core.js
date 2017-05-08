var themisApp = angular.module('themisApp', ['ui.router']);

themisApp.config(function($stateProvider, $locationProvider, $urlRouterProvider) {
	$stateProvider
		.state('home', {
			url: '/',
			template: 'Hello Themis!'
		})

	$locationProvider.html5Mode(true);
});