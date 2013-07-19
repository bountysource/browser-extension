function pluralize(count, noun) {
  var phrase = count + " " + noun;
  if (count !== 1) phrase += "s";
  return phrase;
}

function buildLink(issue, text, subpath) {
  var link = document.createElement("a");
  link.innerText = text;
  link.href = "https://www.bountysource.com/" + issue.frontend_path + subpath;
  link.className = "minibutton";
  return link;
}

function buildClaimLink(issue) {
  var text = "Claim $" + parseFloat(issue.bounty_total).toFixed(2) +
             " bounty (" + pluralize(issue.bounties.length, "backer") + ")";
  return buildLink(issue, text, "/solutions");
}

function buildIncreaseLink(issue) {
  return buildLink(issue, "Increase bounty on Bountysource", "/bounties");
}

function buildNotice(issue) {
  var notice = document.createElement("div");
  notice.className = "bountysource-notice discusion-topic-infobar";
  notice.appendChild(buildClaimLink(issue));
  notice.appendChild(buildIncreaseLink(issue));
  return notice;
}

Bountysource.getIssueByURL(document.location.href, function(issue) {
    var topicWrapper = document.querySelector(".discussion-topic");
    // Not a typo below; they use both discussion and discusion :/
    var infobar = topicWrapper.querySelector(".discusion-topic-infobar");
    var notice = buildNotice(issue);
    topicWrapper.insertBefore(notice, infobar.nextSibling);
});
