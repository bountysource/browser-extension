function sendXHR(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) callback(xhr);
  };
  xhr.open("GET", url, true);
  xhr.send();
}

function getJSON(url, callback, onError) {
  sendXHR(url, function(xhr) {
    if (xhr.status === 200) {
      var res = JSON.parse(xhr.responseText)
      callback(res);
    } else if(onError) {
      onError(xhr);
    }
  });
}

function search(query, callback, onError) {
  var xhrURL = "https://api.bountysource.com/search?" + 
                 "_method=POST&per_page=1&query=" + encodeURIComponent(query);
  getJSON(xhrURL, callback, onError);
}

var Bountysource = {
  getTrackerByURL: function(url, callback) {
    search(url, function(res) {
      var trackerId = res.redirect_to.split("/")[1];
      var tracker = Object.create(Bountysource.Tracker);
      tracker.id = trackerId;
      tracker.url = "https://www.bountysource.com/trackers/" + trackerId;
      callback(tracker);
    });
  },
  Tracker: {
    getIssues: function(callback, onError) {
      var xhrURL = "https://api.bountysource.com/trackers/48759-jshint/issues?" +
                   "_method=GET&per_page=250";
      getJSON(xhrURL, callback, onError);
    }
  },
  getIssueByURL: function(url, callback, onError) {
    if (url in this._issueURLCache) {
      callback(this._issueURLCache[url]);
    } else {
      search(url, function(res) {
        var issueId = res.redirect_to.split("/")[1];
        Bountysource.getIssue(issueId, function(issue) {
          Bountysource._issueURLCache[url] = issue;
          callback(issue);
        }, onError);
      }, onError);
    }
  },
  getIssue: function(id, callback, onError) {
    var xhrURL = "https://api.bountysource.com/issues/" +
                 encodeURIComponent(id);
    getJSON(xhrURL, callback, onError);
  },
  _issueURLCache: {}
}
