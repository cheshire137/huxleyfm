const Config = require('../config.json');
const fetch = require('node-fetch');

module.exports = class Fetcher {
  get(url) {
    const options = { method: 'GET' };
    return this.makeRequest(url, options);
  }

  post(url, params) {
    const body = [];
    for (const key in params) {
      body.push(key + '=' + encodeURIComponent(params[key]));
    }
    const options = { method: 'POST', body: body.join('&') };
    return this.makeRequest(url, options);
  }

  makeRequest(url, options) {
    if (typeof options.headers === 'undefined') {
      options.headers = {};
    }
    options.headers['User-Agent'] = Config.user_agent;
    return new Promise((resolve, reject) => {
      fetch(url, options).then((response) => {
        const respType = response.headers.get('Content-Type');
        const status = response.status + ' ' + response.statusText;
        if (respType === 'text/html') {
          response.text().then((body) => {
            if (response.ok) {
              resolve({ body: body });
            } else {
              reject({ url: url, status: status, body: body });
            }
          }).catch((error) => {
            console.error('failed to parse html response', error);
            reject({ error: error });
          });
        } else {
          response.json().then((json) => {
            if (response.ok) {
              resolve(json);
            } else {
              json.url = url;
              json.status = status;
              reject(json);
            }
          }).catch((error) => {
            console.error('failed to parse json response', error);
            reject({ error: error });
          });
        }
      });
    });
  }
}
