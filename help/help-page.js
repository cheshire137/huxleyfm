const Eventful = require('../models/eventful');

class HelpPage extends Eventful {
  constructor() {
    super();
  }

  removeListeners() {
    console.debug('unbinding about page listeners');
  }
}

module.exports = HelpPage;
