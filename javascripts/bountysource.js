var Bountysource = {
  api_base: 'https://localhost',
  www_base: 'https://localhost',
  // remove localhost from manifest.json
  //api_base: 'https://api.bountysource.com',
  //www_base: 'https://www.bountysource.com',

  api: function(options) {
    chrome.runtime.sendMessage({ action: "get_access_token" }, function(access_token_response) {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            var res = JSON.parse(xhr.responseText);
            options.success(res);
          } else if (options.error) {
            options.error(xhr);
          }
        }
      };
      xhr.open(options.method || "GET", Bountysource.api_base + options.path, true);
      xhr.setRequestHeader('Accept', 'application/vnd.bountysource+json; version=2');
      if (access_token_response.access_token) {
        xhr.setRequestHeader('Authorization', 'token ' + access_token_response.access_token);
      }
      xhr.send();
    });
  }
};
