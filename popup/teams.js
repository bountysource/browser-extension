'use strict';

angular.module('app').controller('TeamsController', function ($scope, $http, $routeParams) {
  $http.get('https://api.bountysource.com/teams/' + $routeParams.id, {
    headers: { Accept: 'application/vnd.bountysource+json; version=2' }
  }).then(function(results) {
    $scope.team = results.data;

    $http.get('https://api.bountysource.com/issues', {
      headers: { Accept: 'application/vnd.bountysource+json; version=2' },
      params: { tracker_team_id: $scope.team.id, order: 'bounty' }
    }).then(function(results) {
      $scope.issues = results.data;
    });

  });


});
