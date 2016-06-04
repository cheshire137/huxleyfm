const Eventful = require('../models/eventful');

class HelpPage extends Eventful {
  constructor() {
    console.debug('help page init');
    super();
  }

  removeListeners() {
    console.debug('unbinding help page listeners');
  }
}

module.exports = HelpPage;
