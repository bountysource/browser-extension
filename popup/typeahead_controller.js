'use strict';

angular.module('app').controller('TypeaheadController', function ($scope, $http, $location, $route) {

  $scope.typeahead = {
    query: null,
    activeIdx: -1,
    results: null,

    row_hovered: function(idx) {
      $scope.typeahead.activeIdx = idx;
    },

    input_changed: function() {
      if ($scope.typeahead.timeout) {
        clearTimeout($scope.typeahead.timeout);
      }

      if ($scope.typeahead.query) {
        $scope.typeahead.timeout = setTimeout($scope.typeahead.update_results, 200);
      } else {
        $scope.typeahead.results = [];
      }
    },

    input_keydown: function($event) {
      if (!$scope.typeahead.results) {
        return;
      }

      if ($event.which === 40 /*down*/) {
        $scope.typeahead.activeIdx = ($scope.typeahead.activeIdx + 1) % $scope.typeahead.results.length;
        $event.preventDefault();
      } else if ($event.which === 38 /*up*/) {
        $scope.typeahead.activeIdx = ($scope.typeahead.activeIdx > 0 ? $scope.typeahead.activeIdx : $scope.typeahead.results.length) - 1;
        $event.preventDefault();
      } else if ($event.which === 13 /*enter*/ || $event.which === 9 /*tab*/) {
        if ($scope.typeahead.activeIdx >= 0) {
          $scope.typeahead.result_selected($scope.typeahead.activeIdx);
        }
        $event.preventDefault();
      } else if ($event.which === 27 /*esc*/) {
        $scope.typeahead.query = null;
        $scope.typeahead.activeIdx = -1;
        $scope.typeahead.results = null;
        $event.preventDefault();
      }
    },

    update_results: function() {
      $http.get('https://api.bountysource.com/tags', {
        headers: { Accept: 'application/vnd.bountysource+json; version=2' },
        params: { search: $scope.typeahead.query }
      }).then(function(results) {
        $scope.typeahead.activeIdx = -1;
        $scope.typeahead.results = results.data.slice(0,15);
      });
    },

    result_selected: function(index) {
      var item = $scope.typeahead.results[index];

      $scope.typeahead.query = null;
      $scope.typeahead.activeIdx = -1;
      $scope.typeahead.results = null;

      if (item.type === 'Team') {
        $location.url("/teams/" + item.slug);
      } else if (item.type === 'Tag') {
        $location.url("/teams?tag_id=" + item.id);
      }

      $route.reload();
    }
  };
});
