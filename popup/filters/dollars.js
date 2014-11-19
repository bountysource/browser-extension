'use strict';

/*
* Show currency value with correct unit.
* */
angular.module('app').filter('dollars', function($filter) {
  return function(value, options) {
    options = options || {};
    return '$' + $filter('number')(value, 0);
  };
});
