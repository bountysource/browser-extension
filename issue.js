Bountysource.getIssueByURL(document.location.href, function(issue) {
    var commentWrapper = document.querySelector(".comment-body");
    var notice = document.createElement("a");
    notice.innerText = "Worth $" + parseFloat(issue.bounty_total).toFixed(2) +
                       " on Bountysource!";
    notice.href = "https://www.bountysource.com/" + issue.frontend_path;
    commentWrapper.insertBefore(notice, commentWrapper.childNodes[0]);
});
