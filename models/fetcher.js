const Config = require('../config.json');
const fetch = require('node-fetch');

module.exports = class Fetcher {
  get(url) {
    const options = {
      headers: {
        'User-Agent': Config.user_agent
      }
    };
    return new Promise((resolve, reject) => {
      fetch(url, options).then((response) => {
        response.json().then((json) => {
          if (response.ok) {
            resolve(json);
          } else {
            json.url = url;
            json.status = response.status + ' ' + response.statusText;
            reject(json);
          }
        });
      });
    });
  }
}
