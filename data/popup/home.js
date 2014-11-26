'use strict';

angular.module('app').config(function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'home.html',
    controller: 'HomeController'
  });
}).controller('HomeController', function ($scope, $bountysource, $location, $route) {

  $scope.img_src_logo = $bountysource.imagePath('Bountysource-green.png');
  $scope.img_src_thumbs20 = $bountysource.imagePath('thumbsup-20.png');

  $bountysource.api({
    path: 'people/me'
  }, function(response) {
    $scope.current_person = response;
    $scope.$digest();

    if (response.id) {
      console.log("getting thumbs");
      $bountysource.api({
        path: 'issues',
        params: {
          thumbed_by_person_id: response.id,
          order: 'thumbed_at',
          include_team: true
        }
      }, function(thumbed_response) {
        $scope.thumbed_issues = thumbed_response;
        $scope.$digest();
      });
    }
  });

  // $bountysource.api({
  //   path: 'teams'
  // }, function(response) {
  //   $scope.response = response;
  // });



});
