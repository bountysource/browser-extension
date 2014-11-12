alert('issue.js');

function pluralize(count, noun) {
  var phrase = count + " " + noun;
  if (count !== 1) phrase += "s";
  return phrase;
}

function buildLink(model, text, subpath, className) {
  var link = document.createElement("a");
  link.innerText = text;
  link.href = "https://www.bountysource.com/" + model.frontend_path + subpath;
  link.className = className;
  return link;
}

function buildHeader() {
  var header = document.createElement("a");
  header.href = "https://www.bountysource.com/";
  header.className = "bountysource-notice-header";

  var logo = document.createElement("img");
  logo.src = chrome.runtime.getURL("/logo.png");
  header.appendChild(logo);

  return header;
}

function buildClaimLink(issue) {
  var text = "Claim $" + parseFloat(issue.bounty_total).toFixed(2) +
             " bounty (" + pluralize(issue.bounties.length, "backer") + ")";
  return buildLink(issue, text, "/solutions", "minibutton primary");
}

function buildIncreaseLink(issue) {
  return buildLink(issue, "Increase bounty", "/bounties", "minibutton");
}

function buildCreateLink(issue) {
  return buildLink(issue, "Create bounty", "", "minibutton primary");
}

function buildNotice() {
  var notice = document.createElement("div");
  notice.className = "bountysource-notice discusion-topic-infobar";
  notice.appendChild(buildHeader());
  return notice;
}

function buildAcceptedSolutionLink(issue, solution) {
  var text = solution.person.display_name + " has claimed the $" +
             parseFloat(issue.bounty_total).toFixed(2) + " bounty!";
  return buildLink(issue, text, "/solutions", "bountysource-accepted-solution");
}

function updateNotice(issue) {
  // Link to the accepted solution, if present.
  var solution;
  for (var i = 0; i < issue.submitted_solutions.length; i++) {
    solution = issue.submitted_solutions[i];
    if (solution.accepted) {
      notice.appendChild(buildAcceptedSolutionLink(issue, solution));
      return;
    }
  }

  // No accepted solution yet? Set up the claim/create buttons.
  if (parseFloat(issue.bounty_total) > 0) {
    notice.appendChild(buildClaimLink(issue));
    notice.appendChild(buildIncreaseLink(issue));
  } else {
    notice.appendChild(buildCreateLink(issue));
  }

  var issuePath = issue.frontend_path;
  notice.querySelector(".bountysource-notice-header").href += issuePath;

  notice.classList.add("loaded");
}

function onAPIError(xhr) {
  var message = document.createElement("p");
  message.className = "bountysource-notice-error";
  message.innerText = "Could not connect to Bountysource API. " +
                      "Try again later.";
  notice.appendChild(message);

  notice.classList.add("loaded");
}

// Add the notice immediately, even if we don't have data for it yet, to avoid
// ugly reflows. Class names aren't typos; Github really does use both
// "discussion" and "discusion".
var topicWrapper = document.getElementsByClassName("discussion-sidebar")[0];
var notice = buildNotice();
topicWrapper.insertBefore(notice, topicWrapper.firstChild);

Bountysource.getIssueByURL(document.location.href, updateNotice, onAPIError);
