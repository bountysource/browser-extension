function updateBounties(group) {
  var issueLinks = group.querySelectorAll("h4 a");
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
var recentGroup = null;
setInterval(function() {
  var currentGroup = document.querySelector(".issue-list-group");
  if (currentGroup !== recentGroup) {
    // It's possible that there might be no group because there are no results.
    // Okay; don't do the update, but still set the recent group.
    if (currentGroup) {
      updateBounties(currentGroup);
    }
    recentGroup = currentGroup;
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
