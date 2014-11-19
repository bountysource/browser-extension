var ThumbBox = function(options) {
  options = options || {};
  this.issue_url = options.issue_url || document.location.href;
  if (options.size === 'small') {
    this.container_class = 'bountysource-thumbs-box-mini';
    this.image_path = chrome.extension.getURL('images/thumbsup-20.png');
  } else {
    this.container_class = 'bountysource-thumbs-box';
    this.image_path = chrome.extension.getURL('images/thumbsup-32.png');
  }

  this.createDom();
  this.setInfoBox('spinner');
  this.getDataFromApi();
};

ThumbBox.prototype.createDom = function() {
  this.container = document.createElement('div');
  this.container.className = this.container_class;

  this.thumb_wrapper = document.createElement('div');
  this.thumb_wrapper.className = 'thumb-wrapper';
  this.thumb_wrapper.addEventListener('click', this.thumbClicked.bind(this));
  this.container.appendChild(this.thumb_wrapper);

  this.thumb_image = document.createElement('img');
  this.thumb_image.src = this.image_path;
  this.thumb_wrapper.appendChild(this.thumb_image);

  this.info_wrapper = document.createElement('div');
  this.info_wrapper.className = 'info-wrapper';
  this.container.appendChild(this.info_wrapper);
};

ThumbBox.prototype.setInfoBox = function(text) {
  if (text === 'spinner') {
    var spinner_image = document.createElement('img');
    spinner_image.src = chrome.extension.getURL('images/spinner.gif');
    this.info_wrapper.innerHTML = '';
    this.info_wrapper.appendChild(spinner_image);
  } else {
    this.info_wrapper.innerHTML = text;
  }
};

ThumbBox.prototype.thumbClicked = function() {
  if (this.api_response && this.api_response.issue_id) {
    Bountysource.api({
      method: 'POST',
      path: '/thumbs?issue_id=' + encodeURIComponent(this.api_response.issue_id) + '&downvote=' + !!this.api_response.has_thumbed_up,
      success: this.getDataFromApiSuccess.bind(this),
      error: this.getDataFromApiError.bind(this)
    });
  }
};

ThumbBox.prototype.getDataFromApi = function(attempts) {
  attempts = (attempts || 0) + 1;
  Bountysource.api({
    method: 'GET',
    path: '/thumbs?url=' + encodeURIComponent(this.issue_url) + (attempts > 1 ? '&is_retry=true' : ''),
    success: function(response) {
      // decaying retries at second: 1, 2, 4, 8, 16, 32 (max 7 requests over 64 seconds)
      if (response.retry) {
        if (attempts < 7) {
          setTimeout(this.getDataFromApi.bind(this, attempts), Math.pow(2, attempts-1) * 1000);
          console.log("Thumbs: Retry #" + attempts);
        } else {
          this.setInfoBox('ERR1');
          console.log("Thumbs: ERR1 Max attempts reached");
        }
      } else {
        this.getDataFromApiSuccess(response);
      }
    }.bind(this),
    error: this.getDataFromApiError.bind(this)
  });
};

ThumbBox.prototype.getDataFromApiSuccess = function(response) {
  if (response.issue_id) {
    this.api_response = response;
    this.setInfoBox(response.thumbs_up_count);
    this.container.className = this.container_class + (response.has_thumbed_up ? ' has-thumbed-up' : '');
  } else if (response.redirect_to) {
    document.location.href = response.redirect_to;
  } else {
    this.setInfoBox('ERR2');
    console.log("Thumbs: ERR2", response);
  }
};

ThumbBox.prototype.getDataFromApiError = function(response) {
  this.setInfoBox('ERR3');
  console.log("Thumbs: ERR3", response);
};



/* hook into the page DOM */
(function() {
  // Github (single page app so use fancy timers)
  if (document.location.href.match(/^https:\/\/github\.com\//)) {
    var previousGithubPath = null;
    var checkGithubUrlForChange = function() {
      if ((document.location.pathname !== previousGithubPath) && !document.querySelector('.is-context-loading')) {
        previousGithubPath = document.location.pathname;

        if (previousGithubPath.match(/^\/[^/]+\/[^/]+\/(issues|pull)\/\d+/) && !document.querySelector('.repo-private-label')) {
          var header = document.querySelector('#show_issue,.view-pull-request');

          if (header.className.indexOf('bountysource-thumbs-github-indent-header') === -1) {
            header.className = header.className + ' bountysource-thumbs-github-indent-header';
          }

          if (!header.querySelector('.'+this.container_class)) {
            header.insertBefore((new ThumbBox()).container, header.firstChild);
          }
        } else if (previousGithubPath.match(/^\/[^/]+\/[^/]+\/(issues|pulls)/) && !document.querySelector('.repo-private-label')) {
          var issues = document.querySelectorAll('.issue-title');

          for (var i=0; i < issues.length; i++) {
            var issue_url = issues[i].getElementsByTagName('a')[0].href;
            var meta = issues[i].querySelector('.issue-meta');
            meta.insertBefore((new ThumbBox({ issue_url: issue_url, size: 'small' })).container, meta.firstChild);
          }
        }

      }
      setTimeout(checkGithubUrlForChange, 50);
    };
    checkGithubUrlForChange();


    // Launchpad
  } else if (document.location.href.match(/^https:\/\/bugs\.launchpad\.net\/[^?]+\/\+bug\/\d+$/)) {
    var header = document.querySelector('.context-publication');
    header.parentNode.insertBefore((new ThumbBox()).container, header);
    header.style.marginLeft = '60px';


    // Bugzilla
  } else if (document.location.href.match(/^https?:\/\/[^?]*\/show_bug\.cgi/)) {
    var header = document.querySelector('.bz_alias_short_desc_container,.page-header');
    header.parentNode.insertBefore((new ThumbBox()).container, header);
    header.style.marginLeft = '60px';
    if (['bugzilla.gnome.org','bugzilla.mozilla.org'].indexOf(document.location.host) >= 0) {
      header.style.marginBottom = '36px';
    }

    // Jira (not working with https://jira.reactos.org/browse/CORE-2853)
    // } else if (document.querySelector('meta[name="application-name"][content="JIRA"]')) {
    //   var header = document.querySelector('.aui-page-header-inner,.issue-header-content');
    //   header.parentNode.insertBefore((new ThumbBox()).container, header);
    //   header.style.marginLeft = '60px';

  }
})();
