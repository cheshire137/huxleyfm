const storage = require('electron-json-storage');
const shell = require('electron').shell;
const fs = require('fs');

module.exports = class SomaPlayerUtil {
  static loadPage(path, pageID) {
    return this.loadPageContent(path).
                then(this.onPageLoaded.bind(this, pageID)).
                catch(this.onPageLoadError.bind(this, path));
  }

  static loadPageContent(path) {
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

  static retrieve(key) {
    return new Promise((resolve, reject) => {
      storage.get(key, (error, value) => {
        if (error) {
          reject(error);
        } else {
          resolve(value);
        }
      });
    });
  }

  static applyTheme(theme) {
    document.body.classList.remove('theme-light');
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-' + (theme || 'light'));
  }

  static getOptions() {
    return this.retrieve('options');
  }

  static store(key, value) {
    return new Promise((resolve, reject) => {
      storage.set(key, value, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  static setOptions(options) {
    return this.store('options', options);
  }

  static onPageLoaded(pageID, data) {
    document.body.classList.remove('player');
    document.body.classList.remove('settings');
    document.body.classList.remove('about');
    document.body.classList.add(pageID);
    document.getElementById('page-container').innerHTML = data;
  }

  static onPageLoadError(path, err) {
    console.error('failed to load page', path, err);
  }

  static onInternalLinkClick(e) {
    e.preventDefault();
    let link = e.target;
    if (link.nodeName !== 'A') {
      link = link.closest('a');
    }
    const path = link.getAttribute('data-page-path');
    const pageID = link.getAttribute('data-page-id');
    this.loadPage(path, pageID);
  }

  onExternalLinkClick(url, e) {
    e.preventDefault();
    shell.openExternal(url);
  }

  static handleLink(link) {
    const url = link.href;
    if (url.indexOf('http') === 0) {
      link.addEventListener('click', this.onExternalLinkClick.bind(this, url));
    } else {
      link.addEventListener('click', this.onInternalLinkClick.bind(this));
    }
  }

  static handleLinks() {
    Array.prototype.forEach.call(document.querySelectorAll('a[href]'),
                                 this.handleLink.bind(this));
  }
}
