// popup a new tab the first time this extension is installed
chrome.runtime.onInstalled.addListener(function(details){
  if (details.reason === "install") {
    chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    }, function(tabs) {
      if (tabs[0].url !== ('https://www.bountysource.com/extension')) {
        chrome.tabs.create({
          url: 'https://www.bountysource.com/extension'
        });
      }
    });
  } else if(details.reason === "update") {
    var thisVersion = chrome.runtime.getManifest().version;
    console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
  }
});

// register a listener so we can pull access token from bountysource.com
chrome.runtime.onMessage.addListener(function(options, sender, sendResponse) {
  if (options.action === 'api_call') {
    console.log("Making XHR request to Bountysource", options);
    chrome.cookies.get({ url: 'https://www.bountysource.com/', name: 'v2_access_token' }, function(response) {
      var access_token = response ? JSON.parse(decodeURIComponent(response.value)) : null;

      // make XHR request to api.bountysource.com
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            var res = JSON.parse(xhr.responseText);
            sendResponse(res);
          } else {
            sendResponse(null);
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

    // always return true so the message doesn't keep getting passed
    return true;
  }
});
