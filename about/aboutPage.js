const Soma = require('../models/soma');
const Eventful = require('../models/eventful');

module.exports = class AboutPage extends Eventful {
  constructor() {
    console.debug('about page init');
    super();
    this.findElements();
  }

  findElements() {
  }

  removeListeners() {
    console.debug('unbinding about page listeners');
  }
}
