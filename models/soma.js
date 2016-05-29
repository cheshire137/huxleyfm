const Config = require('../config.json');
const Fetcher = require('./fetcher');

module.exports = class Soma extends Fetcher {
  getStations() {
    return new Promise((resolve, reject) => {
      this.get(Config.soma_api_url + 'channels.json').then((response) => {
        const stations = [];
        const rawStations = response.channels;
        for (let i = 0; i < rawStations.length; i++) {
          const station = rawStations[i];
          stations.push({ id: station.id, title: station.title });
        }
        stations.sort((a, b) => {
          return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        });
        resolve(stations);
      }).catch(reject);
    });
  }

  getStationInfo(station) {
    return this.get(Config.scrobbler_api_url + '/api/v1/nowplaying/' + station);
  }
}
