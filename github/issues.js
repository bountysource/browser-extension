function updateBounties(list) {
  var issueLinks = list.querySelector(".issue-list-group").
    querySelectorAll("h4 a");
  Array.prototype.forEach.call(issueLinks, function(issueLink) {
    // TODO: Consider requesting all issues up front to avoid all these
    // requests. Might not get 'em all, strictly speaking, even with
    // per_page=250, so this is safer for now.
    Bountysource.getIssueByURL(issueLink.href, function(issue) {
      var total = parseFloat(issue.bounty_total);
      if (total > 0) {
        issueLink.innerText = "[$" + total.toFixed(2) + " bounty] " +
                              issueLink.innerText;
      }
    });
  });
}

var list = document.getElementById("issues_list");
var observer = new WebKitMutationObserver(function(mutations) {
  updateBounties(list);
});
observer.observe(list, {childList: true});
updateBounties(list);

// Add View on Bountysource link.
// The API expects the home page URL, not the issues list URL.
var trackerURL = document.querySelector('meta[property="og:url"]').content;
Bountysource.getTrackerByURL(trackerURL, function(tracker) {
  var remoteTrackerLink = document.createElement("a");
  remoteTrackerLink.href = tracker.url;
  remoteTrackerLink.className = "minibutton blue";
  remoteTrackerLink.innerText = "View on Bountysource";
  var newIssueButton = document.querySelector(".js-new-issue-button");
  newIssueButton.parentNode.insertBefore(remoteTrackerLink, newIssueButton);
});
