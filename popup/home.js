'use strict';

angular.module('app').controller('HomeController', function ($scope, $http, $location, $route) {
  console.log("getting thumbs");

  $http.get(Bountysource.api_base + '/issues', {
    headers: { Accept: 'application/vnd.bountysource+json; version=2' },
    params: { thumbed_by_person_id: 5, order: 'thumbed_at' }
  }).then(function(results) {
    $scope.thumbed_issues = results.data;
  });

});
