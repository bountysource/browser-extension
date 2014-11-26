'use strict';

angular.module('app', ['ui.bootstrap', 'ngRoute', 'ngSanitize']);

// allow chrome-extension:// URLs
angular.module('app').config(function($compileProvider) {
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|file):/);
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|chrome-extension):|data:image\//);
});

angular.module('app').value('$bountysource', BountysourceClient);
