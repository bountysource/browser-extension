'use strict';

angular.module('app').config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'home.html', 
      controller: 'MainController'
    })
    .when('/teams/:id', {
      templateUrl: 'teams.html',
      controller: 'TeamsController'
    })
    .otherwise({redirectTo: '/'});
});
