var Background = {

  initialize: function() {
    Background.registerAccessTokenListener();
  },

  registerAccessTokenListener: function() {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.action === 'get_access_token') {
        console.log("Looking up access_token from bountysource.com cookie");
        chrome.cookies.get({ url: Bountysource.www_base + '/', name: 'v2_access_token' }, function(response) {
          sendResponse({ access_token: response ? JSON.parse(decodeURIComponent(response.value)) : null });
        });
        return true;
      }
    });
  }
};

Background.initialize();


// var selectedId = -1;
// function refreshThumbsCount() {
//   chrome.browserAction.setBadgeText({text: ''+Math.floor(Math.random()*100), tabId: selectedId });
//   chrome.browserAction.setBadgeBackgroundColor({ color: '#666666' });
// }
//
// chrome.tabs.onUpdated.addListener(function(tabId, props) {
//   if (props.status == "complete" && tabId == selectedId)
//     refreshThumbsCount();
// });
//
// chrome.tabs.onSelectionChanged.addListener(function(tabId, props) {
//   selectedId = tabId;
//   refreshThumbsCount();
// });
//
// chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//   selectedId = tabs[0].id;
//   refreshThumbsCount();
// });
