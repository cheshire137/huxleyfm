const Config = require('./config.json');
const crypto = require('crypto');
const fetch = require('node-fetch');

module.exports = class Lastfm {
  constructor() {
  }

  authenticate() {
    this.getToken().then((token) => {
      console.log('token', token);
    });
  }

  getToken() {
    const params = {
      api_key: Config.lastfm_api_key,
      method: 'auth.gettoken',
      format: 'json'
    };
    const url = this.getUrl(this.applySignature(params));
    return new Promise((resolve, reject) => {
      fetch(url).then((response) => {
        if (!response.ok) {
          reject(response.statusText);
          return;
        }
        response.json().then((json) => {
          resolve(json.token);
        });
      });
    });
  }

  applySignature(params) {
    params.api_sig = this.getSignature(params);
    return params;
  }

  getUrl(params) {
    const query = [];
    for (const key in params) {
      query.push(key + '=' + encodeURIComponent(params[key]));
    }
    return Config.lastfm_api_url + '?' + query.join('&');
  }

  getSignature(params) {
    const keys = Object.keys(params);
    keys.sort();
    const orderedParams = [];
    for (let i = 0; i < keys.length; i++) {
      orderedParams.push(keys[i] + params[keys[i]]);
    }
    return this.md5(orderedParams.join(''));
  }

  md5(str) {
    return crypto.createHash('md5').update(str, 'utf8').digest('hex');
  }
}
