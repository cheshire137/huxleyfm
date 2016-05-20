const Config = require('./config.json');
const crypto = require('crypto');
const fetch = require('node-fetch');

module.exports = class Lastfm {
  constructor() {
  }

  authenticate() {
    return new Promise((resolve) => {
      this.getToken().then((token) => {
        const url = Config.lastfm_auth_url +
            '?api_key=' + Config.lastfm_api_key + '&token=' + token;
        const shell = require('electron').shell;
        shell.openExternal(url);
        resolve(token);
      });
    });
  }

  getSession(token) {
    const params = {
      token: token,
      api_key: Config.lastfm_api_key,
      method: 'auth.getsession',
      format: 'json'
    };
    const url = this.getUrl(params);
    return new Promise((resolve, reject) => {
      this.get(url).then((json) => resolve(json.session)).catch(reject);
    });
  }

  getToken() {
    const params = {
      api_key: Config.lastfm_api_key,
      method: 'auth.gettoken',
      format: 'json'
    };
    const url = this.getUrl(params);
    return new Promise((resolve, reject) => {
      this.get(url).then((json) => resolve(json.token)).catch(reject);
    });
  }

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

  getUrl(params) {
    params.api_sig = this.getSignature(params);
    const query = [];
    for (const key in params) {
      query.push(key + '=' + encodeURIComponent(params[key]));
    }
    return Config.lastfm_api_url + '?' + query.join('&');
  }

  // http://www.last.fm/api/desktopauth#6
  getSignature(params) {
    const keys = Object.keys(params);
    keys.sort();
    const orderedParams = [];
    for (let i = 0; i < keys.length; i++) {
      orderedParams.push(keys[i] + params[keys[i]]);
    }
    return this.md5(orderedParams.join('') + Config.lastfm_api_secret);
  }

  md5(str) {
    return crypto.createHash('md5').update(str, 'utf8').digest('hex');
  }
}
