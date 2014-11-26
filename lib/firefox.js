var BountysourceServer = require("./bountysource_server").BountysourceServer;
var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
pageMod.PageMod({

  // inject thumbs.js script into every page
  include: "*",
  contentScriptFile: [data.url("bountysource_client.js"), data.url("thumbs.js")],
  contentScriptOptions: {
    image_base: data.url('images/')
  },
  contentStyleFile: data.url('stylesheets/thumbs.css'),

  // listen for "xhr" events
  onAttach: function(worker) {
    worker.port.on("xhr", function(options) {
      console.log("Making XHR request to Bountysource", options);

      // lookup access token from www.bountysource.com cookie
      var chrome = require("chrome");
      var ios = chrome.components.classes["@mozilla.org/network/io-service;1"].getService(chrome.components.interfaces.nsIIOService);
      var cookieUri = ios.newURI(BountysourceServer.www_base, null, null);
      var cookieSvc = chrome.components.classes["@mozilla.org/cookieService;1"].getService(chrome.components.interfaces.nsICookieService);
      var cookie = cookieSvc.getCookieString(cookieUri, null);
      var cookies = (cookie || '').split('; ');
      for (var i=0; i < cookies.length; i++) {
        var regex_match = cookies[i].match(/^v2_access_token=(.*)$/);
        if (regex_match) {
          options.request.access_token = JSON.parse(decodeURIComponent(regex_match[1]));
          break;
        }
      }
      console.log("Using bountysource access token: ", options.request.access_token);

      BountysourceServer.xhr(options.request, function(response) {
        worker.port.emit(options.callback_str, response);
      });
    });
  }
});
