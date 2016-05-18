const Util = require('./SomaPlayerUtil');

module.exports = class SomaPlayerSettings {
  constructor() {
    this.applyTheme();
  }

  applyTheme() {
    Util.getOptions().then((options) => {
      const theme = options.theme || 'light';
      document.body.classList.remove('theme-light');
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-' + theme);
    });
  }
}
