const SomaPlayer = require('../SomaPlayer');
const Util = require('../SomaPlayerUtil');

document.addEventListener('DOMContentLoaded', function() {
  Util.handleLinks();
  new SomaPlayer();
});
