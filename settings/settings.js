const SomaSettings = require('../SomaPlayerSettings');
const Util = require('../SomaPlayerUtil');

document.addEventListener('DOMContentLoaded', function() {
  Util.handleLinks();
  new SomaSettings();
});
