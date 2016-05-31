const Config = require('../config.json');
const crypto = require('crypto');
const Fetcher = require('./fetcher');

module.exports = class Lastfm extends Fetcher {
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
    const url = this.getGETUrl(params);
    return new Promise((resolve, reject) => {
      this.get(url).then((json) => resolve(json.session)).catch(reject);
    });
  }

  // http://www.last.fm/api/show/track.scrobble
  scrobble(song, auth) {
    const possibleParams = {
      artist: song.artist || '',
      track: song.title || '',
      album: song.album,
      user: auth.user,
      sk: auth.sessionKey,
      api_key: Config.lastfm_api_key,
      chosenByUser: 0,
      method: 'track.scrobble',
      timestamp: Math.round((new Date()).getTime() / 1000)
    };
    const params = {};
    for (const key in possibleParams) {
      const value = possibleParams[key];
      if (typeof value !== 'undefined' && value !== null) {
        params[key] = value;
      }
    }
    params.api_sig = this.getSignature(params);
    const url = Config.lastfm_api_url + '?format=json';
    return this.post(url, params);
  }

  getToken() {
    const params = {
      api_key: Config.lastfm_api_key,
      method: 'auth.gettoken',
      format: 'json'
    };
    const url = this.getGETUrl(params);
    return new Promise((resolve, reject) => {
      this.get(url).then((json) => resolve(json.token)).catch(reject);
    });
  }

  getGETUrl(params) {
    params.api_sig = this.getSignature(params);
    const query = [];
    for (const key in params) {
      query.push(key + '=' + encodeURIComponent(params[key]));
    }
    return Config.lastfm_api_url + '?' + query.join('&');
  }

  // http://www.last.fm/api/desktopauth#6
  getSignature(params) {
    const orderedParams = [];
    Object.keys(params).sort().forEach((key) => {
      if (key !== 'format') {
        orderedParams.push(key + params[key]);
      }
    });
    return this.md5(orderedParams.join('') + Config.lastfm_api_secret);
  }

  md5(str) {
    return crypto.createHash('md5').update(str, 'utf8').digest('hex');
  }
}
