function sendXHR(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) callback(xhr);
  };
  xhr.open("GET", url, true);
  xhr.send();
}

function getJSON(path, callback, onError) {
  sendXHR("https://api.bountysource.com" + path, function(xhr) {
    if (xhr.status === 200) {
      var res = JSON.parse(xhr.responseText)
      callback(res);
    } else if(onError) {
      onError(xhr);
    }
  });
}

function search(query, callback, onError) {
  var path = "/search?_method=POST&per_page=1" +
    "&query=" + encodeURIComponent(query);
  getJSON(path, callback, onError);
}

var Bountysource = {
  getTrackerByURL: function(url, callback) {
    search(url, function(res) {
      var trackerId = res.redirect_to.split("/")[1];
      var tracker = {
        id: trackerId,
        url: "https://www.bountysource.com/trackers/" + trackerId
      };
      callback(tracker);
    });
  },
  getIssueByURL: function(url, callback, onError) {
    if (url in this._issueCache.byURL) {
      callback(this._issueCache.byURL[url]);
    } else {
      search(url, function(res) {
        var issueId = res.redirect_to.split("/")[1];
        Bountysource.getIssue(issueId, function(issue) {
          Bountysource._issueCache.byURL[url] = issue;
          callback(issue);
        }, onError);
      }, onError);
    }
  },
  getIssue: function(id, callback, onError) {
    getJSON("/issues/" + encodeURIComponent(id), callback, onError);
  },
  getIssues: function(repoFullName, numbers, callback, onError) {
    // Callback will be called for each issue, whereas onError will only be
    // called once on failure with the failed XHR.
    if (!(repoFullName in this._issueCache.byRepoFullNameAndNumber)) {
      this._issueCache.byRepoFullNameAndNumber[repoFullName] = {};
    }
    var cacheByNumber = this._issueCache.byRepoFullNameAndNumber[repoFullName];

    // Immediately yield cached issues, and collect cache misses for the
    // upcoming request.
    var misses = [];
    numbers.forEach(function(number) {
      if (number in cacheByNumber) {
        var issue = cacheByNumber[number];
        callback(issue);
      } else {
        misses.push(number);
      }
    });

    // Request issues that are not yet cached.
    if (misses.length) {
      var path = "/bulk/issues" +
        "?repo_full_name=" + encodeURIComponent(repoFullName) +
        "&numbers=" + encodeURIComponent(misses.join(","));
      getJSON(path, function(issues) {
        issues.forEach(function(issue) {
          cacheByNumber[issue.number] = issue;
          callback(issue);
        });
      }, onError);
    }
  },
  _issueCache: {
    byURL: {},
    byRepoFullNameAndNumber: {}
  }
}
