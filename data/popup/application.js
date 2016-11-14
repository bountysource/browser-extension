var BountysourcePopup = {
  start: function() {
    BountysourcePopup.loadCurrentPerson();
    BountysourcePopup.selectTab('thumbs');
    BountysourcePopup.setupTabHandlers();
    BountysourcePopup.setupFeedbackForm();
    BountysourcePopup.loadThumbs();
    BountysourcePopup.setupLinks();
    BountysourcePopup.setupForms();
  },

  loadCurrentPerson: function() {
    // load current person
    BountysourceClient.api({
      path: 'people/me'
    }, function(response) {
      if (response.id) {
        // nav
        document.querySelector('#person-info-profile-link').classList.remove('hide');
        document.querySelector('#person-info-profile-link').href = 'https://www.bountysource.com/people/' + response.slug;
        document.querySelector('#person-info-profile-link img').src = response.image_url_small;
        document.querySelector('#person-info-profile-link span').appendChild(document.createTextNode(response.display_name));

        // issues tab
        document.querySelector('#thumbs-message-none-blank').classList.remove('hide');

        // feedback tab
        document.querySelector('#feedback-email-group').classList.add('hide');
      } else {
        // nav
        document.querySelector('#person-info-signin-link').classList.remove('hide');

        // issues tab
        document.querySelector('#thumbs-message-none-login').classList.remove('hide');

        // feedback tab
        document.querySelector('#feedback-email-group').classList.remove('hide');
      }

      BountysourcePopup.resizePopup();
    });
  },

  loadThumbs: function() {
    document.querySelector('#thumbs-message-loading').classList.remove('hide');

    BountysourceClient.api({
      path: 'issues',
      params: {
        thumbed_by_person_id: 'me',
        order: 'thumbed_at',
        include_team: true,
        include_tracker: true
      }
    }, function(thumbed_response) {
      document.querySelector('#thumbs-message-loading').classList.add('hide');

      if (thumbed_response.length > 0) {
        var table = document.querySelector('#thumbs-table');
        table.classList.remove('hide');

        // dom creation is so gross......
        for (var i=0; i < thumbed_response.length; i++) {
          var issue = thumbed_response[i];

          var tr, td, img, a, div, subdiv, span;

          tr = document.createElement('tr');
          table.firstChild.appendChild(tr);

          // project icon
          td = document.createElement('td');
          tr.appendChild(td);
          img = document.createElement('img');
          img.src = issue.team.image_url_small || issue.tracker.image_url_small;
          td.appendChild(img);

          // project name
          td = document.createElement('td');
          tr.appendChild(td);
          a = document.createElement('a');
          a.target = '_blank';
          a.href = 'https://www.bountysource.com/' + (issue.team.slug ? 'teams' : 'trackers') + '/' + (issue.team.slug || issue.tracker.slug);
          a.appendChild(document.createTextNode(issue.team.name || issue.tracker.display_name));
          td.appendChild(a);
          td.appendChild(document.createTextNode(' » '));
          a = document.createElement('a');
          a.target = '_blank';
          a.href = 'https://www.bountysource.com/issues/' + issue.slug;
          a.appendChild(document.createTextNode(issue.title));
          td.appendChild(a);
          if (issue.bounty_total > 0) {
            span = document.createElement('span');
            span.classList.add('label');
            span.classList.add('label-success');
            span.appendChild(document.createTextNode('$' + parseInt(issue.bounty_total).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")));
            td.appendChild(span);
          }

          // thumb box
          td = document.createElement('td');
          tr.appendChild(td);

          div = document.createElement('div');
          div.classList.add('bountysource-thumbs-box-mini');
          div.classList.add('has-thumbed-up');
          td.appendChild(div);

          subdiv = document.createElement('div');
          subdiv.classList.add('thumb-wrapper');
          div.appendChild(subdiv);
          img = document.createElement('img');
          img.src = '../images/thumbsup-20.png';
          subdiv.appendChild(img);

          subdiv = document.createElement('div');
          subdiv.classList.add('info-wrapper');
          subdiv.appendChild(document.createTextNode(issue.thumbs_up_count));
          div.appendChild(subdiv);

        }

      } else {
        document.querySelector('#thumbs-message-none').classList.remove('hide');
      }

      BountysourcePopup.setupLinks();
      BountysourcePopup.resizePopup();
    });
  },

  setupTabHandlers: function() {
    document.querySelector('#tab-thumbs a').addEventListener('click', function(event) { event.preventDefault(); BountysourcePopup.selectTab('thumbs'); });
    document.querySelector('#tab-feedback a').addEventListener('click', function(event) { event.preventDefault(); BountysourcePopup.selectTab('feedback'); });
  },

  selectTab: function(tab) {
    // unselect all tabs
    document.querySelector('#tab-thumbs').classList.remove('active');
    document.querySelector('#tab-feedback').classList.remove('active');

    // hide all pages
    document.querySelector('#page-thumbs').classList.add('hide');
    document.querySelector('#page-feedback').classList.add('hide');

    // show tab and pages and do init
    if (tab === 'thumbs') {
      document.querySelector('#tab-thumbs').classList.add('active');
      document.querySelector('#page-thumbs').classList.remove('hide');
    } else if (tab === 'feedback') {
      document.querySelector('#tab-feedback').classList.add('active');
      document.querySelector('#page-feedback').classList.remove('hide');
      document.querySelector('#feedback-submitted-alert').classList.add('hide');
      document.querySelector('#feedback-form').classList.remove('hide');
      document.querySelector('#feedbackEmail').value = "";
      document.querySelector('#feedbackMessage').value = "";
    }

    BountysourcePopup.resizePopup();

    BountysourceClient.google_analytics({ path: 'popup/' + tab });
  },

  resizePopup: function() {
    if ((typeof(self) !== 'undefined') && self.port) {
      self.port.emit("message", { action: 'set_popup_height', height: document.body.offsetHeight + 4 });
    }
  },

  setupFeedbackForm: function() {
    document.querySelector('#page-feedback form').addEventListener('submit', BountysourcePopup.submitFeedback);
  },

  submitFeedback: function(event) {
    event.preventDefault();

    BountysourceClient.api({
      method: 'POST',
      path: '/thumbs/feedback',
      params: {
        email: document.querySelector('#feedbackEmail').value,
        message: document.querySelector('#feedbackMessage').value
      }
    }, function(thumbed_response) {
      document.querySelector('#feedback-submitted-alert').classList.remove('hide');
      document.querySelector('#feedback-form').classList.add('hide');
      BountysourcePopup.resizePopup();
    });
  },

  setupLinks: function() {
    if ((typeof(safari) !== 'undefined')) {
      var links = document.querySelectorAll('a[target="_blank"]');
      for (var i = 0; i < links.length; i++) {
        links[i].removeAttribute('target'); 
      }
    }
  },

  setupForms: function() {
    if ((typeof(safari) !== 'undefined')) {
      var links = document.querySelectorAll('form[target="_blank"]');
      for (var i = 0; i < links.length; i++) {
        links[i].removeAttribute('target'); 
      }
    }
  }
};

BountysourcePopup.start();
