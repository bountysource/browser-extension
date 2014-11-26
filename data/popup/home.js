'use strict';

angular.module('app').config(function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'home.html',
    controller: 'HomeController'
  });
}).controller('HomeController', function ($scope, $bountysource, $location, $route) {

  $scope.img_src_logo = $bountysource.imagePath('Bountysource-green.png');
  $scope.img_src_thumbs20 = $bountysource.imagePath('thumbsup-20.png');

  $scope.status = 'loading';

  $bountysource.api({
    path: 'people/me'
  }, function(response) {
    if (response.id) {
      $scope.current_person = response;

      $bountysource.api({
        path: 'issues',
        params: {
          thumbed_by_person_id: response.id,
          order: 'thumbed_at',
          include_team: true,
          include_tracker: true
        }
      }, function(thumbed_response) {
        if (thumbed_response.length > 0) {
          $scope.thumbed_issues = thumbed_response;
        } else {
          $scope.status = 'no_issues';
        }
        $scope.$digest();
      });
    } else {
      $scope.status = 'signin';
    }

    $scope.$digest();
  });

});
