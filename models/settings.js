const storage = require('electron-json-storage');

module.exports = class Settings {
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

  static load() {
    return this.retrieve('settings');
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

  static save(settings) {
    return this.store('settings', settings);
  }
};
