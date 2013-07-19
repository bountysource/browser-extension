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

function buildCreateLink(issue) {
  return buildLink(issue, "Create bounty on Bountysource", "");
}

function buildNotice() {
  var notice = document.createElement("div");
  notice.className = "bountysource-notice discusion-topic-infobar";
  return notice;
}

function updateNotice(issue) {
  if (parseFloat(issue.bounty_total) > 0) {
    notice.appendChild(buildClaimLink(issue));
    notice.appendChild(buildIncreaseLink(issue));
  } else {
    notice.appendChild(buildCreateLink(issue));
  }
}

// Add the notice immediately, even if we don't have data for it yet, to avoid
// ugly reflows. Class names aren't typos; Github really does use both
// "discussion" and "discusion".
var topicWrapper = document.querySelector(".discussion-topic");
var infobar = topicWrapper.querySelector(".discusion-topic-infobar");
var notice = buildNotice();
topicWrapper.insertBefore(notice, infobar.nextSibling);

Bountysource.getIssueByURL(document.location.href, updateNotice);
