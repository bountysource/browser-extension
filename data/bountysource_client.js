// Cross-browser helpers to be used in popups and content-scripts
var BountysourceClient = {
  browser: typeof(chrome)!=='undefined' ? 'chrome' : 'firefox',

  // Computes path to extension hosted image
  imagePath: function(image) {
    if (window.chrome) {
      return chrome.extension.getURL('data/images/' + image);
    } else if (self && self.options && self.options.image_base) {
      return self.options.image_base + image;
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
  },

  matches: Element.prototype.matches ||
      Element.prototype.mozMatchesSelector ||
      Element.prototype.msMatchesSelector ||
      Element.prototype.oMatchesSelector ||
      Element.prototype.webkitMatchesSelector
};
