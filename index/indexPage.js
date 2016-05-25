const Soma = require('../models/soma');
const Settings = require('../models/settings');
const DefaultStations = require('../defaultStations.json');
const Eventful = require('../models/eventful');
const Config = require('../config.json');

const __bind = function(fn, me) {
  return function() {
    return fn.apply(me, arguments);
  };
};

module.exports = class IndexPage extends Eventful {
  constructor(settings) {
    super();
    this.settings = settings;
    this.onTrack = __bind(this.onTrack, this);
    this.findElements();
    this.listenForStationChanges();
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
    this.audioTag = document.querySelector('audio');
  }

  listenForStationChanges() {
    this.stationSelect.addEventListener('change',
                                        this.onStationChange.bind(this));
  }

  onStationChange() {
    const newStation = this.stationSelect.value;
    if (newStation === '') {
      this.playButton.disabled = true;
      this.hideTrackInfo();
      const oldStation = this.audioTag.getAttribute('data-station');
      this.unsubscribe(oldStation).catch(this.unsubscribeError.bind(this));
      this.audioTag.pause();
      this.audioTag.currentTime = 0;
      this.audioTag.removeAttribute('data-station');
      this.audioTag.removeAttribute('data-paused');
    } else {
      this.playButton.disabled = false;
      this.pause();
      this.play();
    }
  }

  pause() {
    const station = this.stationSelect.value;
    this.unsubscribe(station).catch(this.unsubscribeError.bind(this));
    this.audioTag.pause();
    this.audioTag.currentTime = 0;
    this.audioTag.setAttribute('data-paused', 'true');
  }

  play() {
    const station = this.stationSelect.value;
    this.resetTrackInfoIfNecessary(station);
    this.subscribe(station).then(() => {
      this.socket.on('track', this.onTrack);
      this.audioTag.src = Config.soma_station_url + station;
      this.audioTag.setAttribute('data-station', station);
      this.audioTag.removeAttribute('data-paused');
    }).catch(this.subscribeError.bind(this));
  }

  resetTrackInfoIfNecessary(station) {
    if (this.audioTag.getAttribute('data-station') === station) {
      return;
    }
    this.titleEl.textContent = '';
    this.artistEl.textContent = '';
  }

  subscribe(station) {
    if (this.socket && this.socket.connected) {
      return this.emitSubscribe(station);
    }
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        this.socket = require('socket.io-client')(Config.scrobbler_api_url);
      }
      this.socket.on('connect', () => {
        this.emitSubscribe(station).then(resolve).catch(reject);
      });
    });
  }

  subscribeError(station, response) {
    console.error('failed to subscribe to ' + station, response);
  }

  unsubscribe(station) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        resolve();
        return;
      }
      this.socket.emit('unsubscribe', station, (response) => {
        if (response.unsubscribed) {
          this.socket.removeListener('track', this.onTrack);
          resolve();
        } else {
          reject(station, response);
        }
      });
    });
  }

  unsubscribeError(station, response) {
    console.error('failed to unsubscribe from ' + station, response);
  }

  emitSubscribe(station) {
    return new Promise((resolve, reject) => {
      this.socket.emit('subscribe', station, (response) => {
        if (response.subscribed) {
          resolve(station);
        } else {
          reject(station, response);
        }
      });
    });
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

  showTrackInfo(info) {
    if (info.artist || info.title) {
      this.titleEl.textContent = info.title;
      this.artistEl.textContent = info.artist;
      this.currentInfoEl.classList.remove('hidden');
    }
  }

  hideTrackInfo() {
    this.titleEl.textContent = '';
    this.artistEl.textContent = '';
    this.currentInfoEl.classList.add('hidden');
  }
}
