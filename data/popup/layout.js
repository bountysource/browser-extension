'use strict';

angular.module('app').controller('LayoutController', function ($rootScope, $bountysource, $window) {

  $rootScope.tabIsSelected = function(id) {
    return ($window.document.location.hash === id);
  };

  $bountysource.api({
    path: 'people/me'
  }, function(response) {
    if (response.id) {
      $rootScope.current_person = response;
    } else {
      $rootScope.current_person = {};
    }

    $rootScope.$digest();
  });

});
