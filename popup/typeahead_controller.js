'use strict';

angular.module('app').controller('TypeaheadController', function ($scope, $http) {
  $scope.typeahead = {
    query: null,

    submit_search: function() {
      if ($scope.search_typeahead.query && $scope.search_typeahead.query.length > 0) {
        $location.path("/search").search({ query: $scope.search_typeahead.query });
      }
    },

    update_results: function(search_text) {
      var response = $http({
        url: 'https://api.bountysource.com/tags',
        headers: { Accept: 'application/vnd.bountysource+json; version=2' },
        params: { search: search_text }
      });
      return response;
    },

    selected: function(item) {
      console.log("SELECTED!", item);
      if (item.type === 'Team') {
        $location.url("/teams/" + item.slug);
        $route.reload(); // because reloadOnSearch: false
        $scope.search_typeahead.query = null;
      } else if (item.type === 'Tag') {
        $location.url("/teams?tag_id=" + item.id);
        $route.reload(); // because reloadOnSearch: false
        $scope.search_typeahead.query = null;
      }
    }
  };
});
