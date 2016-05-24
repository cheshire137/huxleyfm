const storage = require('electron-json-storage');

module.exports = class SomaPlayerUtil {
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

  static handleLinks() {
    const shell = require('electron').shell;
    const links = document.querySelectorAll('a[href]');
    Array.prototype.forEach.call(links, function(link) {
      const url = link.getAttribute('href');
      if (url.indexOf('http') === 0) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          shell.openExternal(url);
        });
      }
    });
  }
}
