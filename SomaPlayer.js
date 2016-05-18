const Util = require('./SomaPlayerUtil');

module.exports = class SomaPlayer {
  constructor() {
    this.applyTheme();
  }

  applyTheme() {
    Util.getOptions().then((options) => {
      const theme = options.theme || 'light';
      document.body.classList.add('theme-' + theme);
    });
  }
}
