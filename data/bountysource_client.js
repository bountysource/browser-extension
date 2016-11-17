// Cross-browser helpers to be used in popups and content-scripts
var BountysourceClient = {
  browser: typeof(chrome)!=='undefined' ? 'chrome' : typeof(safari)!=='undefined' ? 'safari' : 'firefox',

  // Computes path to extension hosted image
  imagePath: function(image) {
    if (window.chrome) {
      return chrome.extension.getURL('data/images/' + image);
    } else if (self && self.options && self.options.image_base) {
      return self.options.image_base + image;
    } else if (window.safari) {
      return safari.extension.baseURI + 'data/images/' + image;
    }
  },

  // Passes message to BountysourceServer for handling
  //   required: action (string)
  //   optional: callback (method)
  message: function(options) {
    var callback = (function(){});
    if (options.callback) {
      callback = options.callback;
      delete options.callback;
    }
    if (BountysourceClient.browser === 'chrome') {
      chrome.runtime.sendMessage(options, callback);
    } else if (BountysourceClient.browser === 'firefox') {
      options.callback_str = "callback_" + (new Date()).getTime();
      self.port.once(options.callback_str, callback);
      self.port.emit("message", options);
    } else if (BountysourceClient.browser === 'safari') {
      // Check if is sending from popover or normal page
      if (safari.self.tab) {
        // Is normal page
        // Equivalent code of self.port.once
        options.callback_str = "callback_" + (new Date()).getTime();
        var handler = function(event) {
          if (event.name === options.callback_str) {
            callback(event.message);
            safari.self.removeEventListener('message', handler);
          }
        }
        safari.self.addEventListener('message', handler, false);
        safari.self.tab.dispatchMessage('message', options);
      } else {
        // Is popover
        var BountysourceServer = safari.extension.globalPage.contentWindow.BountysourceServer;
        BountysourceServer.get_access_token(function(access_token) {
            options.access_token = access_token;
            options.callback = callback;

            BountysourceServer[options.action](options);
          });
      }
    }
  },

  // Make authenticated request to bountysource API server
  api: function(request, callback) {
    BountysourceClient.message({ action: "api", request: request, callback: callback });
  },

  // Record command in google analytics
  google_analytics: function(request) {
    // if we don't use a timeout, Firefox periodically throws a "callback not found" error
    setTimeout(function() {
      BountysourceClient.message({ action: "google_analytics", request: request });
    }, 0);
  }
};
