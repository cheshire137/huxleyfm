const path = require('path');
var Application = require('spectron').Application;
var assert = require('assert');

describe('application launch', function() {
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

  it('shows an initial window', function() {
    return this.app.client.getWindowCount().then(count => {
      assert.equal(count, 1);
    });
  });

  it('is visible', function() {
    return this.app.browserWindow.isVisible().then(isVisible => {
      assert(isVisible);
    });
  });

  it('has a title', function() {
    return this.app.client.getTitle().then(title => {
      assert.equal('HuxleyFM', title);
    });
  });
});
