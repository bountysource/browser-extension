'use strict';

angular.module('app').controller('LayoutController', function ($rootScope, $bountysource) {

  $rootScope.img_src_logo = $bountysource.imagePath('Bountysource-green.png');

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
