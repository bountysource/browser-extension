'use strict';

angular.module('app').controller('HomeController', function ($scope, $http, $location, $route) {

  Bountysource.getAccessToken(function(response) {
    var access_token = response.access_token;
    $http.get(Bountysource.api_base + '/issues', {
      headers: { Accept: 'application/vnd.bountysource+json; version=2' },
      params: { thumbed_by_person_id: parseInt(access_token), order: 'thumbed_at' }
    }).then(function(results) {
      $scope.thumbed_issues = results.data;
    });
  });

});
