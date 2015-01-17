// GOOGLE CHROME - load javascript dependencies via script tag
// FIREFOX - do nothing... these are loaded via bountysource_server.js
(function() {
  var scripts = ['../bountysource_client.js', 'application.js'];

  if (typeof(chrome) !== 'undefined') {
    for (var i=0; i < scripts.length; i++) {
      var script_tag = document.createElement('script');
      script_tag.src = scripts[i];
      document.head.appendChild(script_tag);
    }
  }
})();
