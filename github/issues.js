var repoFullName = document.querySelector(
  'meta[name="octolytics-dimension-repository_nwo"]').content;
var trackerURL = document.querySelector('meta[property="og:url"]').content;

function updateBounties(list) {
  var issueLinks = list.querySelector(".issue-list-group").
    querySelectorAll("h4 a");
  var issueLinksByNumber = {};
  var numbers = [];
  Array.prototype.forEach.call(issueLinks, function(issueLink) {
    var number = issueLink.href.split("/").pop();
    issueLinksByNumber[number] = issueLink;
    numbers.push(number);
  });

  Bountysource.getIssues(repoFullName, numbers, function(issue) {
    var issueLink = issueLinksByNumber[issue.number];
    var total = parseFloat(issue.bounty_total);
    if (total > 0) {
      issueLink.innerText = "[$" + total.toFixed(2) + " bounty] " +
                            issueLink.innerText;
    }
  });
}

var list = document.getElementById("issues_list");
var observer = new WebKitMutationObserver(function(mutations) {
  updateBounties(list);
});
observer.observe(list, {childList: true});
updateBounties(list);

// Add View on Bountysource link.
Bountysource.getTrackerByURL(trackerURL, function(tracker) {
  var remoteTrackerLink = document.createElement("a");
  remoteTrackerLink.href = tracker.url;
  remoteTrackerLink.className = "minibutton blue";
  remoteTrackerLink.innerText = "View on Bountysource";
  var newIssueButton = document.querySelector(".js-new-issue-button");
  newIssueButton.parentNode.insertBefore(remoteTrackerLink, newIssueButton);
});
