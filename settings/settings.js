const SomaSettings = require('../models/SomaPlayerSettings');
const Util = require('../models/SomaPlayerUtil');

document.addEventListener('DOMContentLoaded', function() {
  Util.handleLinks();
  new SomaSettings();
});
