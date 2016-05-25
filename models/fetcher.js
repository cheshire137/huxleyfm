const Config = require('../config.json');
const fetch = require('node-fetch');

module.exports = class Fetcher {
  get(url) {
    const options = { method: 'GET' };
    return this.fetchJSON(url, options);
  }

  post(url, params) {
    const body = [];
    for (const key in params) {
      body.push(key + '=' + encodeURIComponent(params[key]));
    }
    const options = { method: 'POST', body: body.join('&') };
    return this.fetchJSON(url, options);
  }

  fetchJSON(url, options) {
    if (typeof options.headers === 'undefined') {
      options.headers = {};
    }
    options.headers['User-Agent'] = Config.user_agent;
    if (options.method === 'POST')
      console.log('post params', url, options);
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
