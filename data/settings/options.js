(function() {
    var Options = function() {
        this.hideThumbsChkbox = document.getElementById("hide-thumbs-checkbox");
        this.restoreOptions()
        this.hideThumbsup();
    };

    Options.prototype.restoreOptions = function() {
        var self = this;

        chrome.storage.sync.get({
            hideThumbsup: true
        }, function(items) {
            self.hideThumbsChkbox.checked = items.hideThumbsup;
        });
    };

    Options.prototype.hideThumbsup = function() {
        var self = this;

        self.hideThumbsChkbox.addEventListener("change", function() {
            chrome.storage.sync.set({
                hideThumbsup: self.hideThumbsChkbox.checked
            });
        });
    };

    document.addEventListener('DOMContentLoaded', function() {
        new Options()
    });
})();