const Eventful = require('./eventful');
const path = require('path');
const fs = require('fs');

class Router extends Eventful {
  constructor() {
    super();
  }

  loadPage(pathSuffix, pageID) {
    const dir = path.join(__dirname, '..');
    const pagePath = `${dir}/${pathSuffix}`;
    return this.loadPageContent(pagePath).
                then(this.onPageLoaded.bind(this, pageID)).
                catch(this.onPageLoadError.bind(this, pagePath));
  }

  loadPageContent(pagePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(pagePath, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  onPageLoaded(pageID, data) {
    this.emit('page:loaded', pageID, data);
  }

  onPageLoadError(pagePath, err) {
    console.error('failed to load page', pagePath, err);
  }
}

module.exports = Router
