const Util = require('./SomaPlayerUtil');

module.exports = class SomaPlayer {
  constructor() {
    this.applyTheme();
  }

  applyTheme() {
    Util.getOptions().then((options) => {
      Util.applyTheme(options.theme);
    });
  }
}
