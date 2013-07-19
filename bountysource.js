function sendXHR(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) callback(xhr);
  };
  xhr.open("GET", url, true);
  xhr.send();
}

function search(query, callback) {
  var xhrURL = "https://api.bountysource.com/search?" + 
                 "_method=POST&per_page=1&query=" + encodeURIComponent(query);
  sendXHR(xhrURL, function(xhr) {
    var res = JSON.parse(xhr.responseText);
    callback(res);
  });
}

var Bountysource = {
  getTrackerByURL: function(url, callback) {
    search(url, function(res) {
      var trackerId = res.redirect_to.split("/")[1];
      var tracker = Object.create(Bountysource.Tracker);
      tracker.id = trackerId;
      callback(tracker);
    });
  },
  Tracker: {
    getIssues: function(callback) {
      var xhrURL = "https://api.bountysource.com/trackers/48759-jshint/issues?" +
                   "_method=GET&per_page=250";
      sendXHR(xhrURL, function(xhr) {
        var issues = JSON.parse(xhr.responseText);
        callback(issues);
      });
    }
  },
  getIssueByURL: function(url, callback) {
    if (url in this._issueURLCache) {
      return this._issueURLCache[url];
    } else {
      search(url, function(res) {
        var issueId = res.redirect_to.split("/")[1];
        Bountysource.getIssue(issueId, function(issue) {
          Bountysource._issueURLCache[url] = issue;
          callback(issue);
        });
      });
    }
  },
  getIssue: function(id, callback) {
    var xhrURL = "https://api.bountysource.com/issues/" +
                 encodeURIComponent(id);
    sendXHR(xhrURL, function(xhr) {
      var issue = JSON.parse(xhr.responseText);
      callback(issue);
    });
  },
  _issueURLCache: {}
}
