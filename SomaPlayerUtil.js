const storage = require('electron-json-storage');

module.exports = class SomaPlayerUtil {
  static getOptions() {
    return new Promise((resolve, reject) => {
      storage.get('options', (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }
}
