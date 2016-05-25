const Soma = require('../models/soma');
const Settings = require('../models/settings');
const DefaultStations = require('../defaultStations.json');
const Eventful = require('../models/eventful');
const Config = require('../config.json');
const Lastfm = require('../models/lastfm');

const __bind = function(fn, me) {
  return function() {
    return fn.apply(me, arguments);
  };
};

module.exports = class IndexPage extends Eventful {
  constructor(settings, audioTag) {
    super();
    this.settings = settings;
    this.audioTag = audioTag;
    this.onTrack = __bind(this.onTrack, this);
    this.findElements();
    this.listenForMusicChanges();
    this.getStations().then(this.insertStationOptions.bind(this)).
                       then(this.restorePlayingInfo.bind(this)).
                       catch(this.loadDefaultStations.bind(this));
    this.stationSelect.focus();
  }

  findElements() {
    this.stationSelect = document.getElementById('station');
    this.playButton = document.getElementById('play');
    this.pauseButton = document.getElementById('pause');
    this.currentInfoEl = document.getElementById('currently-playing');
    this.titleEl = document.getElementById('title');
    this.artistEl = document.getElementById('artist');
    this.albumEl = document.getElementById('album');
    this.durationEl = document.getElementById('duration');
  }

  listenForMusicChanges() {
    this.stationSelect.addEventListener('change',
                                        this.onStationChange.bind(this));
    this.stationSelect.addEventListener('keypress',
                                        this.onStationKeypress.bind(this));
    this.playButton.addEventListener('click', this.play.bind(this));
    this.pauseButton.addEventListener('click', this.pause.bind(this));
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

  onStationKeypress(event) {
    const keyCode = event.keyCode;
    if (keyCode !== 13) { // Enter
      return;
    }
    if (this.stationSelect.value === '') {
      return;
    }
    if (!this.playButton.disabled &&
        !this.playButton.classList.contains('hidden')) {
      this.play();
    } else if (!this.pauseButton.disabled &&
               !this.pauseButton.classList.contains('hidden')) {
      this.pause();
    }
  }

  restorePlayingInfo() {
    const isPaused = this.audioTag.getAttribute('data-paused') === 'true';
    const station = this.audioTag.getAttribute('data-station');
    if (isPaused) {
      this.pauseButton.classList.add('hidden');
      this.playButton.classList.remove('hidden');
      this.playButton.disabled = false;
    } else if (station) {
      this.playButton.classList.add('hidden');
      this.pauseButton.classList.remove('hidden');
      this.pauseButton.disabled = false;
    }
    if (station) {
      const options = this.stationSelect.querySelectorAll('option');
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        if (option.value === station) {
          option.selected = 'selected';
          break;
        }
      }
      this.updateTrackInfo(station);
    }
  }

  pause() {
    const station = this.audioTag.getAttribute('data-station');
    if (station) {
      this.unsubscribe(station).catch(this.unsubscribeError.bind(this));
    }
    this.audioTag.pause();
    this.audioTag.currentTime = 0;
    this.audioTag.setAttribute('data-paused', 'true');
    this.pauseButton.classList.add('hidden');
    this.playButton.classList.remove('hidden');
    this.playButton.disabled = false;
    this.stationSelect.focus();
  }

  play() {
    const station = this.stationSelect.value;
    this.resetTrackInfoIfNecessary(station);
    this.subscribe(station).then(() => {
      this.updateTrackInfo(station);
      this.socket.on('track', this.onTrack);
      this.audioTag.src = Config.soma_station_url + station;
      this.audioTag.setAttribute('data-station', station);
      this.audioTag.removeAttribute('data-paused');
      this.playButton.classList.add('hidden');
      this.pauseButton.classList.remove('hidden');
      this.pauseButton.disabled = false;
      this.stationSelect.focus();
    }).catch(this.subscribeError.bind(this));
  }

  resetTrackInfoIfNecessary(station) {
    if (this.audioTag.getAttribute('data-station') === station) {
      return;
    }
    this.hideTrackInfo();
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

  updateTrackInfo(station) {
    const soma = new Soma();
    soma.getStationInfo(station).then(this.showTrackInfo.bind(this)).
                                 catch(this.getStationInfoError.bind(this));
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

  showTrackInfo(track) {
    const duration = this.getDuration(track);
    if (track.artist || track.title || track.album || duration) {
      this.titleEl.textContent = track.title;
      this.artistEl.textContent = track.artist;
      this.durationEl.textContent = duration;
      this.albumEl.textContent = track.album;
      this.currentInfoEl.classList.remove('hidden');
    } else {
      this.currentInfoEl.classList.add('hidden');
    }
  }

  getDuration(track) {
    if (typeof track.duration !== 'number') {
      return;
    }
    if (track.duration === 0) {
      return;
    }
    const secNum = track.duration / 1000;
    const minutes = Math.floor(secNum / 60) % 60;
    const seconds = secNum % 60;
    return minutes + 'm ' + seconds + 's';
  }

  getStationInfoError(error) {
    console.error('failed getting station current track info', error);
    this.emit('error', 'Could not get current track info for station.')
  }

  hideTrackInfo() {
    this.titleEl.textContent = '';
    this.artistEl.textContent = '';
    this.durationEl.textContent = '';
    this.albumEl.textContent = '';
    this.currentInfoEl.classList.add('hidden');
  }

  onTrack(track) {
    this.showTrackInfo(track);
    this.notifyAboutTrack(track);
    this.scrobbleTrack(track);
  }

  notifyAboutTrack(track) {
    if (!this.settings.notifications) {
      return;
    }
  }

  scrobbleTrack(track) {
    if (!this.settings.lastfmSessionKey || !this.settings.lastfmUser ||
        !this.settings.scrobbling) {
      return;
    }
    console.log('scrobble track', track);
    const lastfm = new Lastfm();
    const auth = {
      user: this.settings.lastfmUser,
      sessionKey: this.settings.lastfmSessionKey
    };
    lastfm.scrobble(track, auth).then(this.onScrobbled.bind(this)).
                                 catch(this.onScrobbleError.bind(this));
  }

  onScrobbled(response) {
    console.log('scrobbled', response);
    this.emit('notice', 'Scrobbled track!');
  }

  onScrobbleError(error) {
    console.error('failed to scrobble track', error);
    this.emit('error', 'Failed to scrobble track.');
  }
}
