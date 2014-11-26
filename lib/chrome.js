// popup a new tab the first time this extension is installed
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

// register a listener so we can pull access token from bountysource.com
chrome.runtime.onMessage.addListener(function(options, sender, sendResponse) {
  if (options.action === 'xhr') {
    console.log("Making XHR request to Bountysource", options);
    chrome.cookies.get({ url: BountysourceServer.www_base, name: 'v2_access_token' }, function(response) {
      options.request.access_token = response ? JSON.parse(decodeURIComponent(response.value)) : null;
      BountysourceServer.xhr(options.request, sendResponse);
    });

    // always return true so the message doesn't keep getting passed
    return true;
  }
});
