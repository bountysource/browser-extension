function updateBounties(issueListGroup) {
  var issueLinks = issueListGroup.querySelectorAll("h4 a");
  Array.prototype.forEach.call(issueLinks, function(issueLink) {
    // TODO: Consider requesting all issues up front to avoid all these
    // requests. Might not get 'em all, strictly speaking, even with
    // per_page=250, so this is safer for now.
    // TODO: cache issues in case the user flips between pages
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
