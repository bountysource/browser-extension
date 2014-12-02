'use strict';

angular.module('app').config(function($routeProvider) {
  $routeProvider.when('/feedback', {
    templateUrl: 'feedback.html',
    controller: 'FeedbackController'
  });
}).controller('FeedbackController', function ($scope, $bountysource, $location, $route) {

  $scope.feedback = {};
  $scope.submit_feedback = function() {
    $bountysource.api({
      method: 'POST',
      path: '/thumbs/feedback',
      params: $scope.feedback
    }, function(thumbed_response) {
      $scope.feedback_submitted = true;
      $scope.$digest();
    });
  };

});
