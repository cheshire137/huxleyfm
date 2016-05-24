const Eventful = require('./eventful');

class Router extends Eventful {
  constructor() {
    super();
  }

  loadPage(path, pageID) {
    return this.loadPageContent(path).
                then(this.onPageLoaded.bind(this, pageID)).
                catch(this.onPageLoadError.bind(this, path));
  }

  loadPageContent(path) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, (err, data) => {
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

  onPageLoadError(path, err) {
    console.error('failed to load page', path, err);
  }
}

module.exports = Router
