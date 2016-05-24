const Util = require('./models/SomaPlayerUtil');

document.addEventListener('DOMContentLoaded', function() {
  Util.loadPage('index/index.html', 'player').then(() => {
    Util.handleLinks();
  });
});
