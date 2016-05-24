const SomaPlayer = require('../models/SomaPlayer');
const Util = require('../models/SomaPlayerUtil');

document.addEventListener('DOMContentLoaded', function() {
  Util.handleLinks();
  new SomaPlayer();
});
