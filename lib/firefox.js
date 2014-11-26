const {XMLHttpRequest} = require("sdk/net/xhr");
var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
pageMod.PageMod({

  // inject thumbs.js script into every page
  include: "*",
  contentScriptFile: data.url("thumbs.js"),
  contentScriptOptions: {
    image_base: data.url('images/')
  },
  contentStyleFile: data.url('stylesheets/thumbs.css'),

  // listen for "get cookie" events
  onAttach: function(worker) {
    worker.port.on("api_call", function(options) {
      console.log("Making XHR request to Bountysource", options);

      // lookup access token from www.bountysource.com cookie
      var access_token = null;
      var chrome = require("chrome");
      var ios = chrome.components.classes["@mozilla.org/network/io-service;1"].getService(chrome.components.interfaces.nsIIOService);
      var cookieUri = ios.newURI("https://www.bountysource.com/", null, null);
      var cookieSvc = chrome.components.classes["@mozilla.org/cookieService;1"].getService(chrome.components.interfaces.nsICookieService);
      var cookie = cookieSvc.getCookieString(cookieUri, null);
      var cookies = (cookie || '').split('; ');
      for (var i=0; i < cookies.length; i++) {
        var regex_match = cookies[i].match(/^v2_access_token=(.*)$/);
        if (regex_match) {
          access_token = JSON.parse(decodeURIComponent(regex_match[1]));
          break;
        }
      }
      console.log("Using bountysource access token: ", access_token);

      // make XHR request to api.bountysource.com
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            var res = JSON.parse(xhr.responseText);
            worker.port.emit(options.callback_str, res);
          } else {
            worker.port.emit(options.callback_str, null);
          }
        }
      };
      xhr.open(options.request.method || "GET", 'https://api.bountysource.com' + options.request.path, true);
      xhr.setRequestHeader('Accept', 'application/vnd.bountysource+json; version=2');
      if (access_token) {
        xhr.setRequestHeader('Authorization', 'token ' + access_token);
      }
      if (options.request.body) {
        var body = JSON.stringify(options.request.body);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(body);
      } else {
        xhr.send();
      }
    });
  }
});
