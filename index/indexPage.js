const Soma = require('../models/soma');
const Settings = require('../models/settings');
const DefaultStations = require('../defaultStations.json');
const Eventful = require('../models/eventful');

module.exports = class IndexPage extends Eventful {
  constructor(settings) {
    super();
    this.settings = settings;
    this.findElements();
    this.getStations().then(this.insertStationOptions.bind(this)).
                       catch(this.loadDefaultStations.bind(this));
  }

  findElements() {
    this.stationSelect = document.getElementById('station');
    this.playButton = document.getElementById('play');
    this.pauseButton = document.getElementById('pause');
    this.currentInfoEl = document.getElementById('currently-playing');
    this.titleEl = document.getElementById('title');
    this.artistEl = document.getElementById('artist');
  }

  insertStationOptions(stations) {
    stations.forEach((station) => {
      const option = document.createElement('option');
      option.value = station.id;
      option.textContent = station.title;
      this.stationSelect.appendChild(option);
    });
    this.stationSelect.disabled = false;
  }

  loadDefaultStations() {
    this.insertStationOptions(DefaultStations);
  }

  getStations() {
    return new Promise((resolve, reject) => {
      if (this.settings.stations && this.settings.stations.length > 0) {
        resolve(this.settings.stations);
      } else {
        const soma = new Soma();
        soma.getStations().then(this.saveStations.bind(this)).
                           then(resolve).catch(reject);
      }
    });
  }

  saveStations(stations) {
    this.settings.stations = stations;
    Settings.save(this.settings).then(() => {
      this.emit('settings:change', this.settings);
    }).catch(this.saveStationError.bind(this));
  }

  saveStationError(error) {
    console.error('failed to save stations', error);
  }
}
