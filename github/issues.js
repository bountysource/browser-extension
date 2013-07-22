function updateBounties(issueListGroup) {
  var issueLinks = issueListGroup.querySelectorAll("h4 a");
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

// TODO: Ew ew ew! Right now we check the list element every second to see if
// it's been replaced yet. If so, the user has moved to a new page with new
// issues, so we need to update the bounties. It's not super-reliable to hook
// into Github's own code, though. Watch with mutation observers, maybe?
var recentIssueListGroup = null;
setInterval(function() {
  var currentIssueListGroup = document.querySelector(".issue-list-group");
  if (currentIssueListGroup !== recentIssueListGroup) {
    updateBounties(currentIssueListGroup);
    recentIssueListGroup = currentIssueListGroup;
  }
}, 1000);

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
