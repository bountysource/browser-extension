// firefox needs a bit of help
if (typeof(XMLHttpRequest) === 'undefined') {
  var XMLHttpRequest = require("sdk/net/xhr").XMLHttpRequest;
}

if (typeof(localStorage) === 'undefined') {
  var localStorage = require("sdk/simple-storage").storage;
}

// global functions
var BountysourceServer = {
  browser: typeof(chrome)!=='undefined' ? 'chrome' : 'firefox',

  www_base: 'https://www.bountysource.com/',
  api_base: 'https://api.bountysource.com/',

  start: function() {
    // attach message listner for BountysourceClient
    if (BountysourceServer.browser === 'chrome') {
      chrome.runtime.onMessage.addListener(function(options, sender, sendResponse) {

        BountysourceServer.get_access_token(function(access_token) {
          options.access_token = access_token;
          options.callback = sendResponse;
          BountysourceServer[options.action](options);
        });

        // always return true so the message doesn't keep getting passed
        return true;
      });
    } else if (BountysourceServer.browser === 'firefox') {
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

        // receive message from BountysourceClient
        onAttach: function(worker) {
          worker.port.on("message", function(options) {
            BountysourceServer.get_access_token(function(access_token) {
              options.access_token = access_token;

              // turn callback_str into function
              options.callback = function(response) {
                worker.port.emit(options.callback_str, response);
              };

              BountysourceServer[options.action](options);
            });
          });
        }
      });
    }


    // popup a new tab the first time this extension is installed
    if (BountysourceServer.browser === 'chrome') {
      chrome.runtime.onInstalled.addListener(function(details){
        if (details.reason === "install") {
          chrome.tabs.query({
            active: true,
            lastFocusedWindow: true
          }, function(tabs) {
            if (tabs[0].url !== BountysourceServer.www_url('/extension')) {
              chrome.tabs.create({
                url: BountysourceServer.www_url('/extension')
              });
            }
          });
        } else if(details.reason === "update") {
          var thisVersion = chrome.runtime.getManifest().version;
          console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
        }
      });
    }


    // record initial page load
    BountysourceServer.get_access_token(function(access_token) {
      BountysourceServer.google_analytics({
        request: { path: 'background' },
        access_token: access_token
      });
    });
  },

  www_url: function(path) {
    return BountysourceServer.www_base + (path.replace(/^\//,''));
  },

  api_url: function(path) {
    return BountysourceServer.api_base + (path.replace(/^\//,''));
  },

  get_guid: function() {
    // generate one just in case we need it later...
    // thanks http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    var new_uid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });

    if (!localStorage['ga_cid']) {
      localStorage['ga_cid'] = new_uid;
    }
    return localStorage['ga_cid'];
  },

  // lookup access_token cookie from www.bountysource.com
  get_access_token: function(callback) {
    if (BountysourceServer.browser === 'chrome') {
      chrome.cookies.get({ url: BountysourceServer.www_base, name: 'v2_access_token' }, function(cookies) {
        callback(cookies ? JSON.parse(decodeURIComponent(cookies.value)) : null);
      });
    } else if (BountysourceServer.browser === 'firefox') {
      // lookup access_token cookie from www.bountysource.com
      var ff_chrome = require("chrome");
      var ios = ff_chrome.components.classes["@mozilla.org/network/io-service;1"].getService(ff_chrome.components.interfaces.nsIIOService);
      var cookieUri = ios.newURI(BountysourceServer.www_base, null, null);
      var cookieSvc = ff_chrome.components.classes["@mozilla.org/cookieService;1"].getService(ff_chrome.components.interfaces.nsICookieService);
      var cookie = cookieSvc.getCookieString(cookieUri, null);
      var cookies = (cookie || '').split('; ');
      for (var i=0; i < cookies.length; i++) {
        var regex_match = cookies[i].match(/^v2_access_token=(.*)$/);
        if (regex_match) {
          callback(JSON.parse(decodeURIComponent(regex_match[1])));
          return;
        }
      }
      callback(null);
    }
  },

  api: function(options) {
    console.log("Making XHR request to Bountysource", options);

    // make XHR request to api.bountysource.com
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        options.callback(xhr.status === 200 ? JSON.parse(xhr.responseText) : null);
      }
    };

    var path = BountysourceServer.api_url(options.request.path);
    if (options.request.params) {
      Object.keys(options.request.params).forEach(function(key, index) {
        path += (path.indexOf('?') === -1) ? '?' : '&';
        path += key + '=' + encodeURIComponent(options.request.params[key]);
      });
    }

    xhr.open(options.request.method || "GET", path, true);
    xhr.setRequestHeader('Accept', 'application/vnd.bountysource+json; version=2');
    if (options.access_token) {
      xhr.setRequestHeader('Authorization', 'token ' + options.access_token);
    }
    if (options.request.body) {
      var body = JSON.stringify(options.request.body);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(body);
    } else {
      xhr.send();
    }
  },

  google_analytics: function(options) {
    // DOCS: https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters

    var params = {};
    params.v = '1';
    params.tid = 'UA-36879724-5';
    params.cid = BountysourceServer.get_guid();
    params.t = 'pageview';
    params.dl = BountysourceServer.www_url('extension/' + options.request.path.replace(/^\//,''));
    if (options.access_token) {
      params.uid = parseInt(options.access_token);
    }

    var xhr = new XMLHttpRequest();
    var path = 'https://ssl.google-analytics.com/collect';
    Object.keys(params).forEach(function(key, index) {
      path += (path.indexOf('?') === -1) ? '?' : '&';
      path += key + '=' + encodeURIComponent(params[key]);
    });
    xhr.open('GET', path, true);
    xhr.send();
  }
};

BountysourceServer.start();
