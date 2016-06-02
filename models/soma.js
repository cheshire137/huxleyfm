const Config = require('../config.json');
const Fetcher = require('./fetcher');
const crypto = require('crypto');

module.exports = class Soma extends Fetcher {
  getStations(simple) {
    return new Promise((resolve, reject) => {
      this.get(Config.soma_api_url + 'channels.json').then((response) => {
        let stations = [];
        const rawStations = response.channels;
        if (simple) {
          stations = rawStations.map((s) => {
            return { id: s.id, title: s.title, imageUrl: s.xlimage };
          });
        } else {
          stations = rawStations.slice();
        }
        stations.sort((a, b) => {
          return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        });
        resolve(stations);
      }).catch(reject);
    });
  }

  getStationSongs(station) {
    return new Promise((resolve, reject) => {
      const url = Config.soma_api_url + `songs/${station}.json`;
      this.get(url).then((response) => {
        const songs = response.songs.map((song) => {
          song.id = 'song-' + crypto.createHash('md5').
              update(song.title + song.artist + song.album + song.date, 'utf8').
              digest('hex');
          if (typeof song.date === 'string') {
            song.date = new Date(parseInt(song.date, 10) * 1000);
          }
          return song;
        });
        songs.sort((a, b) => {
          if (a.date && b.date) {
            if (a.date < b.date) {
              return -1;
            }
            return a.date > b.date ? 1 : 0;
          }
          return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        });
        resolve(songs);
      }).catch(reject);
    });
  }

  getStationInfo(station) {
    return new Promise((resolve, reject) => {
      this.getStations().then((stations) => {
        resolve(stations.filter((s) => s.id === station)[0]);
      }).catch(reject);
    });
  }
};
