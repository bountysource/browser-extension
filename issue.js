function pluralize(count, noun) {
  var phrase = count + " " + noun;
  if (count !== 1) phrase += "s";
  return phrase;
}

Bountysource.getIssueByURL(document.location.href, function(issue) {
    var commentWrapper = document.querySelector(".comment-body");
    var notice = document.createElement("a");
    notice.innerText = "Worth $" + parseFloat(issue.bounty_total).toFixed(2) +
                       " from " + pluralize(issue.bounties.length, "backer") +
                       " on Bountysource!";
    notice.href = "https://www.bountysource.com/" + issue.frontend_path;
    commentWrapper.insertBefore(notice, commentWrapper.childNodes[0]);
});
