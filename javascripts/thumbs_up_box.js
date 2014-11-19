var Thumbs = {
  initialize: function() {
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

            if (!header.querySelector('.bountysource-thumbs-box')) {
              header.insertBefore(Thumbs.createBoxDom(), header.firstChild);
            }
          } else if (previousGithubPath.match(/^\/[^/]+\/[^/]+\/(issues|pulls)/) && !document.querySelector('.repo-private-label')) {
            var issues = document.querySelectorAll('.issue-title');

            for (var i=0; i < issues.length; i++) {
              console.log(issues[i]);
              var meta = issues[i].querySelector('.issue-meta');
              meta.insertBefore(Thumbs.createBoxDom(), meta.firstChild);
            }
          }

        }
        setTimeout(checkGithubUrlForChange, 50);
      };
      checkGithubUrlForChange();


    // Launchpad
    } else if (document.location.href.match(/^https:\/\/bugs\.launchpad\.net\/[^?]+\/\+bug\/\d+$/)) {
      var header = document.querySelector('.context-publication');
      header.parentNode.insertBefore(Thumbs.createBoxDom(), header);
      header.style.marginLeft = '60px';


    // Bugzilla
    } else if (document.location.href.match(/^https?:\/\/[^?]*\/show_bug\.cgi/)) {
      var header = document.querySelector('.bz_alias_short_desc_container,.page-header');
      header.parentNode.insertBefore(Thumbs.createBoxDom(), header);
      header.style.marginLeft = '60px';
      if (['bugzilla.gnome.org','bugzilla.mozilla.org'].indexOf(document.location.host) >= 0) {
        header.style.marginBottom = '36px';
      }

    // Jira (not working with https://jira.reactos.org/browse/CORE-2853)
    // } else if (document.querySelector('meta[name="application-name"][content="JIRA"]')) {
    //   var header = document.querySelector('.aui-page-header-inner,.issue-header-content');
    //   header.parentNode.insertBefore(Thumbs.createBoxDom(), header);
    //   header.style.marginLeft = '60px';

    }
  },

  // create box object
  box: function() {

  }


  createBoxDom: function() {
    var container = document.createElement('div');
    container.className = 'bountysource-thumbs-box';

    var thumb_wrapper = document.createElement('div');
    thumb_wrapper.className = 'thumb-wrapper';
    thumb_wrapper.addEventListener('click', Thumbs.thumbClicked);
    container.appendChild(thumb_wrapper);

    var thumb_image = document.createElement('img');
    thumb_image.src = chrome.extension.getURL('images/thumbsup-32.png');
    thumb_wrapper.appendChild(thumb_image);

    var info_wrapper = document.createElement('div');
    info_wrapper.className = 'info-wrapper';
    container.appendChild(info_wrapper);

    Thumbs.container = container;
    Thumbs.setInfoBox('spinner');
    Thumbs.api_attempts = null;
    Thumbs.getDataFromApi();

    return container;
  },

  setInfoBox: function(text) {
    var info_wrapper = Thumbs.container.querySelector('.info-wrapper');
    if (text === 'spinner') {
      var spinner_image = document.createElement('img');
      spinner_image.src = chrome.extension.getURL('images/spinner.gif');
      info_wrapper.innerHTML = '';
      info_wrapper.appendChild(spinner_image);
    } else {
      info_wrapper.innerHTML = text;
    }
  },

  thumbClicked: function() {
    if (Thumbs.api_response && Thumbs.api_response.issue_id && !Thumbs.api_response.has_thumbed_up) {
      Thumbs.setInfoBox('spinner');
      Bountysource.api({
        method: 'POST',
        path: '/thumbs?issue_id=' + encodeURIComponent(Thumbs.api_response.issue_id),
        success: Thumbs.getDataFromApiSuccess,
        error: Thumbs.getDataFromApiError
      });
    }
  },

  getDataFromApi: function() {
    Thumbs.api_attempts = (Thumbs.api_attempts || 0) + 1;
    Bountysource.api({
      method: 'GET',
      path: '/thumbs?url=' + encodeURIComponent(document.location.href) + (Thumbs.api_attempts > 1 ? '&is_retry=true' : ''),
      success: function(response) {
        // decaying retries at second: 1, 2, 4, 8, 16, 32 (max 7 requests over 64 seconds)
        if (response.retry) {
          if (Thumbs.api_attempts < 7) {
            setTimeout(Thumbs.getDataFromApi, Math.pow(2, Thumbs.api_attempts-1) * 1000);
            console.log("Thumbs: Retry #" + Thumbs.api_attempts);
          } else {
            Thumbs.setInfoBox('ERR1');
            console.log("Thumbs: ERR1 Max attempts reached");
          }
        } else {
          Thumbs.getDataFromApiSuccess(response);
        }
      },
      error: Thumbs.getDataFromApiError
    });
  },

  getDataFromApiSuccess: function(response) {
    if (response.issue_id) {
      Thumbs.api_response = response;
      Thumbs.setInfoBox(response.thumbs_up_count);
      Thumbs.container.className = 'bountysource-thumbs-box' + (response.has_thumbed_up ? ' has-thumbed-up' : '');
    } else if (response.redirect_to) {
      document.location.href = response.redirect_to;
    } else {
      Thumbs.setInfoBox('ERR2');
      console.log("Thumbs: ERR2", response);
    }
  },

  getDataFromApiError: function(response) {
    Thumbs.setInfoBox('ERR3');
    console.log("Thumbs: ERR3", response);
  }

};


Thumbs.initialize();
