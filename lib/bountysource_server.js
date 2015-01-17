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
    BountysourceServer.start_register_message_handler();
    BountysourceServer.start_register_browser_action();
    BountysourceServer.start_first_time_install();
    BountysourceServer.start_google_analytics_background();
  },

  // listens for messages from BountysourceClient
  start_register_message_handler: function() {
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

      require("sdk/page-mod").PageMod({

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
  },

  start_register_browser_action: function() {
    if (BountysourceServer.browser === 'firefox') {
      var data = require("sdk/self").data;

      var button, panel;
      button = require('sdk/ui/button/toggle').ToggleButton({
        id: "my-button",
        label: "my button",
        icon: {
          "16": "./images/thumbsup-16.png",
          "32": "./images/thumbsup-32.png",
          "64": "./images/thumbsup-64.png"
        },
        onChange: function(state) {
          if (panel) {
            panel.hide();
            panel.destroy();
          }

          if (state.checked) {
            panel = require("sdk/panel").Panel({
              width: 420, // extra 20px for scroll bar
              contentURL: data.url("popup/application.html"),
              contentScriptFile: [
                data.url("bountysource_client.js"),
                data.url("popup/application.js")
              ],
              contentScriptOptions: {
                image_base: data.url('images/')
              },
              onHide: function() {
                button.state('window', {checked: false});
              }
            });

            panel.port.on("message", function(options) {
              if (options.action === 'set_popup_height') {
                panel.resize(panel.width, Math.min(options.height, 600));
              } else {
                BountysourceServer.get_access_token(function(access_token) {
                  options.access_token = access_token;

                  // turn callback_str into function
                  options.callback = function(response) {
                    panel.port.emit(options.callback_str, response);
                  };

                  BountysourceServer[options.action](options);
                });
              }
            });

            panel.show({ position: button });
          }
        }
      });
    }
  },

  // if this is the first time installing the extension, open www.bountysource.com/extension/installed
  start_first_time_install: function() {
    if (localStorage['installed'] !== 'yes') {
      localStorage['installed'] = 'yes';
      var post_install_url = BountysourceServer.www_url('/extension/installed');

      if (BountysourceServer.browser === 'chrome') {
        chrome.tabs.query({ active: true }, function(tabs) {
          if (tabs[0] && (tabs[0].url.indexOf(BountysourceServer.www_base) === 0) || (tabs[0].url.indexOf('https://chrome.google.com/') === 0)) {
            chrome.tabs.update(tabs[0].id, { url: post_install_url });
          } else {
            chrome.tabs.create({ url: post_install_url });
          }
        });
      } else if (BountysourceServer.browser === 'firefox') {
        var tabs = require('sdk/tabs');
        if (tabs.activeTab && ((tabs.activeTab.url.indexOf(BountysourceServer.www_base) === 0) || (tabs.activeTab.url.indexOf('https://addons.mozilla.org/') === 0))) {
          tabs.activeTab.url = post_install_url;
        } else {
          tabs.open(post_install_url);
        }
      }
    }
  },

  start_google_analytics_background: function() {
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
    // console.log("Making XHR request to Bountysource", options);

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
