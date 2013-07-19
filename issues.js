var recentIssueListGroup = null;

function getIssueListGroup() {
  return document.querySelector(".issue-list-group");
}

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

// TODO: Ew ew ew! Watch the list some other way; mutation observers?
setInterval(function() {
  var currentIssueListGroup = getIssueListGroup();
  console.log(currentIssueListGroup);
  if (currentIssueListGroup !== recentIssueListGroup) {
    console.log("Updating", currentIssueListGroup);
    updateBounties(currentIssueListGroup);
    recentIssueListGroup = currentIssueListGroup;
  }
}, 1000);
