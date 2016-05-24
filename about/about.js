const Util = require('../SomaPlayerUtil');

document.addEventListener('DOMContentLoaded', function() {
  Util.handleLinks();
  Util.getOptions().then((options) => {
    Util.applyTheme(options.theme);
  });
});
