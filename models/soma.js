const Config = require('../config.json');
const Fetcher = require('./fetcher');

module.exports = class Soma extends Fetcher {
  getStations(simple) {
    return new Promise((resolve, reject) => {
      this.get(Config.soma_api_url + 'channels.json').then((response) => {
        let stations = [];
        const rawStations = response.channels;
        if (simple) {
          stations = rawStations.map((s) => {
            return {id: s.id, title: s.title};
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
          if (typeof song.date === 'string') {
            song.date = new Date(parseInt(song.date, 10) * 1000);
          }
          return song;
        });
        resolve(songs);
      }).catch(reject);
    });
  }

  getScrobblerApiVersion() {
    return this.get(Config.scrobbler_api_url + '/api/v1/version');
  }

  getStationInfo(station, preferSomaApi) {
    if (preferSomaApi) {
      return new Promise((resolve, reject) => {
        this.getStations().then((stations) => {
          resolve(stations.filter((s) => s.id === station)[0]);
        }).catch(reject);
      });
    }
    return this.get(Config.scrobbler_api_url + '/api/v1/nowplaying/' + station);
  }
}
