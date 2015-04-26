(function() {

  var ThumbBox = function(options) {
    options = options || {};
    this.issue_url = options.issue_url;
    this.impression = options.impression;
    if (options.size === 'small') {
      this.container_class = 'bountysource-thumbs-box-mini';
      this.image_path = BountysourceClient.imagePath('thumbsup-20.png');
    } else {
      this.container_class = 'bountysource-thumbs-box';
      this.image_path = BountysourceClient.imagePath('thumbsup-32.png');
    }

    this.createDom();
    this.setInfoBox('spinner');
  };

  ThumbBox.loadAllData = function(instances, attempts) {
    var urls = [];
    for (var i=0; i < instances.length; i++) {
      urls.push(instances[i].issue_url);
    }

    if (urls.length === 0) {
      return;
    }

    attempts = (attempts || 0) + 1;
    BountysourceClient.api({
      method: 'POST',
      path: '/thumbs/index',
      body: {
        urls: urls,
        impression: instances[0].impression
      }
    }, function(response) {
      if (!response) {
        console.log("ERROR3", response);
        for (var i=0; i < instances.length; i++) {
          instances[i].setInfoBox('ERR3', 'https://github.com/bountysource/browser-extension/issues/22');
        }
      } else if (response.length !== instances.length) {
        console.log("ERROR4, unexpected response", instances.length, response.length);
        for (var i=0; i < instances.length; i++) {
          instances[i].setInfoBox('ERR4', 'https://github.com/bountysource/browser-extension/issues/22');
        }
      } else {
        var retry_instances = [];

        for (var i=0; i < response.length; i++) {
          if (response[i].issue_id) {
            instances[i].setResponse(response[i]);
          } else if (response[i].retry) {
            retry_instances.push(instances[i]);
          } else {
            console.log("ERROR1", response[i]);
            instances[i].setInfoBox('ERR1', 'https://github.com/bountysource/browser-extension/issues/22');
          }
        }

        if ((retry_instances.length > 0)) {
          if (attempts < 8) {
            //console.log("RETRYING", attempts, retry_instances.length, parseInt(Math.pow(1.5, attempts-1) * 1000));
            setTimeout(function() { ThumbBox.loadAllData(retry_instances, attempts); }, parseInt(Math.pow(1.5, attempts-1) * 1000));
          } else {
            console.log("ERROR2: too many retries");
            for (var j=0; j < retry_instances.length; j++) {
              retry_instances[j].setInfoBox('ERR2', 'https://github.com/bountysource/browser-extension/issues/10');
            }
          }
        }
      }
    }.bind(this));
  };

  ThumbBox.prototype.createDom = function() {
    this.container = document.createElement('div');
    this.container.classList.add(this.container_class);

    this.thumb_wrapper = document.createElement('div');
    this.thumb_wrapper.classList.add('thumb-wrapper');
    this.thumb_wrapper.addEventListener('click', this.thumbClicked.bind(this));
    this.container.appendChild(this.thumb_wrapper);

    this.thumb_image = document.createElement('img');
    this.thumb_image.src = this.image_path;
    this.thumb_wrapper.appendChild(this.thumb_image);

    this.info_wrapper = document.createElement('div');
    this.info_wrapper.classList.add('info-wrapper');
    this.container.appendChild(this.info_wrapper);
  };

  ThumbBox.prototype.setInfoBox = function(text, url) {
    while (this.info_wrapper.firstChild) {
      this.info_wrapper.removeChild(this.info_wrapper.firstChild);
    }
    if (text === 'spinner') {
      var spinner_image = document.createElement('img');
      spinner_image.src = BountysourceClient.imagePath('spinner.gif');
      this.info_wrapper.appendChild(spinner_image);
    } else if (url) {
      var link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.appendChild(document.createTextNode(text));
      this.info_wrapper.appendChild(link);
    } else {
      this.info_wrapper.appendChild(document.createTextNode(text));
    }
  };

  ThumbBox.prototype.setResponse = function(response) {
    this.api_response = response;
    this.setInfoBox(response.thumbs_up_count, 'https://www.bountysource.com/issues/' + response.issue_id);
    if (response.has_thumbed_up) {
      this.container.classList.add('has-thumbed-up');
    } else {
      this.container.classList.remove('has-thumbed-up');
    }
  };

  ThumbBox.prototype.thumbClicked = function() {
    if (this.api_response && this.api_response.issue_id) {
      this.setInfoBox('spinner');
      BountysourceClient.api({
        method: 'POST',
        path: '/thumbs',
        body: {
          issue_id: this.api_response.issue_id,
          downvote: !!this.api_response.has_thumbed_up
        },
      }, function(response) {
        if (!response) {
          console.log("ERROR5", response);
          this.setInfoBox('ERR5', 'https://github.com/bountysource/browser-extension/issues/22');
        } else if (response.redirect_to) {
          document.location.href = response.redirect_to;
        } else if (response.issue_id) {
          this.setResponse(response);
        } else {
          console.log("ERROR6", response);
          this.setInfoBox('ERR6', 'https://github.com/bountysource/browser-extension/issues/22');
        }
      }.bind(this));
    }
  };

  var ThumbHide = function() {
    this.hideAllThumbs();
  };

  ThumbHide.prototype.hideAllThumbs = function() {
    var that = this;
    var hideAll = function() {
      var comments = [].slice.call(document.querySelectorAll(".comment-body"));
      var commentsHidden = 0;
      var hideTimelineWrapper = function(node) {
        while (node = node.parentElement) {
          if (BountysourceClient.matches.call(node, '.timeline-comment-wrapper')) {
            node.classList.add('bountysource-comment-hide');
          }
        }
        commentsHidden++;
      };

      for (var i = 0, cL = comments.length; i < cL; i++) {
        var comment = comments[i];
        var trimmedContent = comment.textContent.trim();

        // Search for +1's
        if (trimmedContent.length && /^\+1$/.test(trimmedContent)) {
          hideTimelineWrapper(comment);
        }

        // Search for thumbs up emoji
        else if(!trimmedContent.length && comment.querySelectorAll("[alt=':+1:']").length) {
          hideTimelineWrapper(comment);
        }

        // Show event on timeline
        if (commentsHidden && i === cL - 1) {
          that.showEventOnTimeline(commentsHidden);
        }
      }
    };

    var hideThumbCb = function(msg) {
      if(msg.hideThumbsup)
        hideAll();
      else
        that.showAllThumbs();
    };

    // Get initial thumb prefs
    BountysourceClient.message({action: 'get_hide_thumb_pref', callback: hideThumbCb});

    // Listeners for pref change
    if (BountysourceClient.browser === 'chrome') {
      chrome.runtime.onMessage.addListener(function(options, sender, sendResponse) {
        if(typeof options.hideThumbsup !== "undefined") {
          hideThumbCb(options);
          return true;
        }
      });
    }
    else if (BountysourceClient.browser === 'firefox') {
      self.port.on('hideThumbsup', hideThumbCb);
    }
  };

  ThumbHide.prototype.showAllThumbs = function() {
    var hiddenComments = [].slice.call(document.querySelectorAll('.bountysource-comment-hide'));
    var btevent = document.querySelector('.bountysource-thumbsup-event');

    for (var i = 0, hL = hiddenComments.length; i < hL; i++) {
      hiddenComments[i].classList.remove('bountysource-comment-hide');
    }

    if(btevent) {
      btevent.parentNode.removeChild(btevent);
    }
  };

  ThumbHide.prototype.showEventOnTimeline = function(count) {
    if (document.querySelector('.bountysource-thumbsup-event')) return;

    var hideThumbEventHTML = '\
        <div class="discussion-item-header" id="event-218493532">\
        <span class="octicon octicon-megaphone discussion-item-icon"></span>\
        <a class="renamed-is">Bountysource</a> hid  <span class="renamed-is">${count}</span> comments containing just <span class="renamed-is">:thumbsup:</span> or <span class="renamed-is">+1</span> \
      </div>';
    var firstTimelineComment = document.querySelector(".timeline-comment-wrapper");
    var discussionEvent = document.createElement('div');

    discussionEvent.className = 'discussion-item bountysource-thumbsup-event';
    discussionEvent.innerHTML = hideThumbEventHTML.replace('${count}', count);

    if (firstTimelineComment.nextElementSibling) {
      firstTimelineComment.parentNode.insertBefore(discussionEvent, firstTimelineComment.nextElementSibling);
    }
    else {
      firstTimelineComment.parentNode.appendChild(discussionEvent);
    }
  };

  var matches;

  // Bountysource
  if (document.location.host.match(/\.bountysource\.com$/)) {
    document.body.classList.add('bountysource-thumbs-extension-is-installed');

  // Github (single page app so use fancy timers)
  } else if (document.location.href.match(/^https:\/\/github\.com\//)) {
    document.body.classList.add('bountysource-thumbs-github');

    var previousGithubUrl = null;
    var checkGithubUrlForChange = function() {
      if ((document.location.href !== previousGithubUrl) && !document.querySelector('.is-context-loading')) {
        previousGithubUrl = document.location.href;

        if ((matches = previousGithubUrl.match(/^https:\/\/github\.com\/[^/]+\/[^/]+\/(?:issues|pull)\/\d+/)) && document.body.classList.contains('vis-public')) {
          var header = document.querySelector('#show_issue,.view-pull-request');

          if (!header.querySelector('.bountysource-thumbs-box')) {
            var box = new ThumbBox({ issue_url: matches[0], impression: 'show' });
            header.insertBefore(box.container, header.firstChild);
            ThumbBox.loadAllData([box]);
            BountysourceClient.google_analytics({ path: "thumbs/github/show" });
          }

          if (!document.querySelector('.bountysource-thumbsup-event')) {
            new ThumbHide();
          }
        } else if (previousGithubUrl.match(/^https:\/\/github\.com\/[^/]+\/[^/]+\/(?:issues|pulls|labels|milestones)/) && document.body.classList.contains('vis-public')) {
          var issues = document.querySelectorAll('.issue-title');
          var boxes = [];

          for (var i=0; i < issues.length; i++) {
            var issue_url = issues[i].getElementsByTagName('a')[0].href;
            var meta = issues[i].querySelector('.issue-meta');

            var old_box = issues[i].querySelector('.bountysource-thumbs-box-mini');
            if (old_box) {
              old_box.parentNode.removeChild(old_box);
            }
            var new_box = new ThumbBox({ issue_url: issue_url, size: 'small', impression: 'index' });
            boxes.push(new_box);
            meta.insertBefore(new_box.container, meta.firstChild);
          }
          ThumbBox.loadAllData(boxes);
          BountysourceClient.google_analytics({ path: "thumbs/github/index" });
        }

      }
      setTimeout(function() { checkGithubUrlForChange(); }, 100);
    };
    checkGithubUrlForChange();


  // Launchpad Issue Show
  } else if (matches = document.location.href.match(/^https:\/\/bugs\.launchpad\.net\/[^?]+\/\+bug\/\d+$/)) {
    document.body.classList.add('bountysource-thumbs-launchpad');
    var box = new ThumbBox({ issue_url: matches[0], impression: 'show' });
    var header = document.querySelector('.context-publication');
    header.parentNode.insertBefore(box.container, header);
    ThumbBox.loadAllData([box]);
    BountysourceClient.google_analytics({ path: "thumbs/launchpad/show" });

  // Launchpad Issue Index
  } else if (document.location.href.match(/^https:\/\/bugs\.launchpad\.net\//) && document.querySelector('#bugs-table-listing')) {
    document.body.classList.add('bountysource-thumbs-launchpad');

    // sorting and paginating uses browser-push and requires timers
    var previousLaunchpadUrl = null;
    var checkLaunchpadUrlForChange = function() {
      if ((document.location.href !== previousLaunchpadUrl) && document.querySelector('.yui3-overlay-indicator-hidden')) {
        previousLaunchpadUrl = document.location.href;

        var boxes = [];
        var rows = document.querySelectorAll('.buglisting-row');
        for (var i=0; i < rows.length; i++) {
          var target = rows[i].querySelector('.buglisting-col2 .buginfo-extra');

          // limit to first 500 issues
          if (i < 500) {
            var link = rows[i].querySelector('.bugtitle');
            var box = new ThumbBox({ issue_url: link.href, size: 'small', impression: 'index' });
            boxes.push(box);
            target.insertBefore(box.container, target.firstChild);
          }
        }
        ThumbBox.loadAllData(boxes);
        BountysourceClient.google_analytics({ path: "thumbs/launchpad/index" });
      }
      setTimeout(function() { checkLaunchpadUrlForChange(); }, 100);
    };
    checkLaunchpadUrlForChange();

  // Bugzilla Issue Show
  } else if (matches = document.location.href.match(/^https?:\/\/[^?]*\/show_bug\.cgi\?id=\d+/)) {
    document.body.classList.add('bountysource-thumbs-bugzilla');

    var box = new ThumbBox({ issue_url: matches[0], impression: 'show' });
    var header = document.querySelector('.bz_alias_short_desc_container,.page-header');
    header.parentNode.insertBefore(box.container, header);
    if (['bugzilla.gnome.org','bugzilla.mozilla.org'].indexOf(document.location.host) >= 0) {
      document.body.classList.add('bountysource-thumbs-bugzilla-big-header');
    }
    ThumbBox.loadAllData([box]);
    BountysourceClient.google_analytics({ path: "thumbs/bugzilla/show" });

  // Bugzilla Issue List
  } else if (document.location.href.match(/^https?:\/\/[^?]*\/buglist\.cgi/)) {
    document.body.classList.add('bountysource-thumbs-bugzilla');

    var headers = document.querySelectorAll('tr.bz_buglist_header');
    for (var j=0; j < headers.length; j++) {
      var th = document.createElement('th');
      th.appendChild(document.createTextNode('+1'));
      headers[j].insertBefore(th, headers[j].firstChild);
    }

    var boxes = [];
    var trs = document.querySelectorAll('tr.bz_bugitem');
    for (var i=0; i < trs.length; i++) {
      var td = document.createElement('td');
      trs[i].insertBefore(td, trs[i].firstChild);

      // limit to first 100 issues
      if (i < 100) {
        var link = trs[i].getElementsByTagName('a')[0];
        var box = new ThumbBox({ issue_url: link.href, size: 'small', impression: 'index' });
        boxes.push(box);
        td.appendChild(box.container);
      }
    }
    ThumbBox.loadAllData(boxes);
    BountysourceClient.google_analytics({ path: "thumbs/bugzilla/index" });

  // Trac
  } else if (document.querySelector('link[rel="help"][href$="TracGuide"]')) {
    document.body.classList.add('bountysource-thumbs-trac');

    if (matches = document.querySelector('#ticket.trac-content')) {
      // issue show
      var link = matches.querySelector('h2 a');
      var box = new ThumbBox({ issue_url: link.href, impression: 'show' });
      matches.insertBefore(box.container, matches.firstChild);
      ThumbBox.loadAllData([box]);
      BountysourceClient.google_analytics({ path: "thumbs/trac/show" });

    } else if ((matches = document.querySelectorAll('table.listing.tickets td.ticket, table.listing.tickets td.id')).length > 0) {
      // issues index
      var header = document.querySelector('table.listing.tickets tr.trac-columns');
      var th = document.createElement('th');
      th.appendChild(document.createTextNode('+1'));
      header.insertBefore(th, header.firstChild);

      var boxes = [];
      for (var i=0; i < matches.length; i++) {
        var td = document.createElement('td');
        matches[i].parentNode.insertBefore(td, matches[i]);

        var link = matches[i].getElementsByTagName('a')[0];
        var box = new ThumbBox({ issue_url: link.href, size: 'small', impression: 'index' });
        boxes.push(box);
        td.appendChild(box.container);
      }
      ThumbBox.loadAllData(boxes);
      BountysourceClient.google_analytics({ path: "thumbs/trac/index" });
    }

  // // Jira
  // //   TODO: ERR2 (backend doesn't seem to update thubs_up_count or votes_count)
  // //   TODO: inject thumbs into split-view
  // } else if (document.querySelector('meta[name="application-name"][content="JIRA"]')) {
  //   document.body.classList.add('bountysource-thumbs-jira');
  //
  //   var previousJiraUrl = null;
  //   var checkJiraUrlForChange = function() {
  //     if ((document.location.href !== previousJiraUrl) && (matches = document.querySelector('#issue-content')) && !document.querySelector('#issue-content .bountysource-thumbs-box')) {
  //       // issue show (also works with split view)
  //       previousJiraUrl = document.location.href;
  //
  //       var link = matches.querySelector('#key-val');
  //       var box = new ThumbBox({ issue_url: link.href, impression: 'show' });
  //       matches.insertBefore(box.container, matches.firstChild);
  //       ThumbBox.loadAllData([box]);
  //       BountysourceClient.google_analytics({ path: "thumbs/jira/show" });
  //     } else if ((document.location.href !== previousJiraUrl) && (matches = document.querySelectorAll('#issuetable.navigator-results .issuerow .issuetype')).length > 0) {
  //       // issue index (non-split view)
  //       previousJiraUrl = document.location.href;
  //
  //       var header = document.querySelector('#issuetable .rowHeader');
  //       var th = document.createElement('th');
  //       th.appendChild(document.createTextNode('+1'));
  //       header.insertBefore(th, header.firstChild);
  //
  //       var boxes = [];
  //       for (var i=0; i < matches.length; i++) {
  //         var td = document.createElement('td');
  //         matches[i].parentNode.insertBefore(td, matches[i]);
  //
  //         var link = matches[i].getElementsByTagName('a')[0];
  //         var box = new ThumbBox({ issue_url: link.href, size: 'small', impression: 'index' });
  //         boxes.push(box);
  //         td.appendChild(box.container);
  //       }
  //       ThumbBox.loadAllData(boxes);
  //       BountysourceClient.google_analytics({ path: "thumbs/jira/index" });
  //
  //     }
  //     setTimeout(function() { checkJiraUrlForChange(); }, 100);
  //   };
  //   checkJiraUrlForChange();
  }
})();
