const Eventful = require('../models/eventful');

module.exports = class AboutPage extends Eventful {
  constructor(version) {
    console.debug('about page init');
    super();
    this.appVersion = version;
    this.findElements();
    this.showVersion();
  }

  findElements() {
    this.versionWrapper = document.getElementById('version-wrapper');
  }

  showVersion() {
    if (typeof this.appVersion === 'string') {
      this.versionWrapper.textContent = 'Version ' + this.appVersion;
      this.versionWrapper.classList.remove('hidden');
    }
  }

  removeListeners() {
    console.debug('unbinding about page listeners');
  }
};
