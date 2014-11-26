// Cross-browser helpers to be used in popups and content-scripts
var BountysourceClient = {

  // computes path to extension hosted image
  imagePath: function(image) {
    if (window.chrome) {
      return chrome.extension.getURL('data/images/' + image);
    } else if (self && self.options && self.options.image_base) {
      return self.options.image_base + image;
    }
  },

  // passes a message to background process to make an XHR call to bountysource
  api: function(request, callback) {
    if (window.chrome) {
      chrome.runtime.sendMessage({ action: "xhr", request: request }, callback);
    } else if (self && self.port) {
      var callback_str = "xhr" + (new Date()).getTime();
      self.port.once(callback_str, callback);
      self.port.emit("xhr", { request: request, callback_str: callback_str });
    }
  }
};
