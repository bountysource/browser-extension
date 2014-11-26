// firefox needs a bit of help
if (typeof(XMLHttpRequest) === 'undefined') {
  var XMLHttpRequest = require("sdk/net/xhr").XMLHttpRequest;
}

// global functions
var BountysourceServer = {
  www_base: 'https://www.bountysource.com/',
  api_base: 'https://api.bountysource.com/',

  www_url: function(path) {
    return BountysourceServer.www_base + (path[0] === '/' ? path.slice(1) : path);
  },

  api_url: function(path) {
    return BountysourceServer.api_base + (path[0] === '/' ? path.slice(1) : path);
  },

  xhr: function(request, callback) {
    // make XHR request to api.bountysource.com
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        callback(xhr.status === 200 ? JSON.parse(xhr.responseText) : null);
      }
    };
    xhr.open(request.method || "GET", BountysourceServer.api_url(request.path), true);
    xhr.setRequestHeader('Accept', 'application/vnd.bountysource+json; version=2');
    if (request.access_token) {
      xhr.setRequestHeader('Authorization', 'token ' + request.access_token);
    }
    if (request.body) {
      var body = JSON.stringify(request.body);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(body);
    } else {
      xhr.send();
    }
  }
};

// export this via CommonJS so firefox can load it
if (typeof(exports) !== 'undefined') {
  exports.BountysourceServer = BountysourceServer;
}
