const path = require('path');
var Application = require('spectron').Application;
var assert = require('assert');

describe('index page', function() {
  this.timeout(10000);

  beforeEach(function() {
    this.app = new Application({
      path: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      args: [path.join(__dirname, '..')]
    });
    return this.app.start();
  });

  afterEach(function() {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });

  it('includes station menu when app opens', function() {
    return this.app.client.getText('#station-menu .selected').then(text => {
      assert.equal('Choose a SomaFM station', text);
    });
  });
});
