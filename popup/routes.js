'use strict';

angular.module('app').config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'home.html',
      controller: 'HomeController'
    })
    .when('/teams/:id', {
      templateUrl: 'teams.html',
      controller: 'TeamsController'
    })
    .otherwise({redirectTo: '/'});
});
