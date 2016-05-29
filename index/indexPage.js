const Soma = require('../models/soma');
const Settings = require('../models/settings');
const DefaultStations = require('../defaultStations.json');
const Eventful = require('../models/eventful');
const Config = require('../config.json');
const Lastfm = require('../models/lastfm');
const path = require('path');

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
    this.getStations().then(this.insertStationLinks.bind(this)).
                       then(this.restorePlayingInfo.bind(this)).
                       catch(this.loadDefaultStations.bind(this));
    this.stationMenu.focus();
  }

  findElements() {
    this.stationMenu = document.getElementById('station-menu');
    this.playButton = document.getElementById('play');
    this.pauseButton = document.getElementById('pause');
    this.currentInfoEl = document.getElementById('currently-playing');
    this.titleEl = document.getElementById('title');
    this.artistEl = document.getElementById('artist');
    this.albumEl = document.getElementById('album');
    this.durationEl = document.getElementById('duration');
  }

  listenForMusicChanges() {
    const stationLinks = this.stationMenu.querySelectorAll('a');
    Array.prototype.forEach.call(stationLinks, (link) => {
      link.addEventListener('click', this.onStationLinkClick.bind(this));
      link.addEventListener('keypress', this.onStationKeypress.bind(this));
    });
    this.playButton.addEventListener('click', this.play.bind(this));
    this.pauseButton.addEventListener('click', this.pause.bind(this));
  }

  restoreListItemPosition(listItem) {
    const index = parseInt(listItem.getAttribute('data-index'), 10);
    const newNextListItem = this.stationMenu.
        querySelector('li[data-index="' + (index + 1) + '"]');
    this.stationMenu.insertBefore(listItem, newNextListItem);
  }

  moveListItemToTop(listItem) {
    const firstListItem = this.stationMenu.querySelector('li:first-child');
    this.stationMenu.insertBefore(listItem, firstListItem);
  }

  onStationLinkClick(event) {
    const link = event.target.closest('a');
    const listItem = link.closest('li');
    const listItems = Array.from(this.stationMenu.querySelectorAll('li'));
    listItems.forEach(li => li.classList.remove('selected'));
    listItem.classList.add('selected');
    const newStation = this.getStationFromLink(link);
    const oldStation = this.audioTag.getAttribute('data-station');
    let firstListItem = this.stationMenu.querySelector('li:first-child');
    const chooseStationListItem = this.stationMenu.
        querySelector('li[data-index="0"]');
    if (firstListItem !== listItem) {
      this.restoreListItemPosition(firstListItem);
    }
    if (newStation === oldStation || newStation === '') {
      const icon = chooseStationListItem.querySelector('.material-icons');
      if (this.stationMenu.classList.contains('expanded')) {
        console.debug('collapsing station menu');
        listItems.forEach(li => li.classList.add('hidden'));
        this.stationMenu.classList.remove('expanded');
        icon.textContent = 'keyboard_arrow_right';
      } else {
        console.debug('expanding station menu');
        this.moveListItemToTop(chooseStationListItem);
        listItems.forEach(li => li.classList.remove('hidden'));
        this.stationMenu.classList.add('expanded');
        icon.textContent = 'keyboard_arrow_down';
      }
      if (newStation === '') {
        this.playButton.disabled = true;
        this.pause();
        this.hideTrackInfo();
        if (oldStation) {
          this.unsubscribe(oldStation).catch(this.unsubscribeError.bind(this));
        }
        this.audioTag.pause();
        this.audioTag.currentTime = 0;
        this.audioTag.removeAttribute('data-station');
        this.audioTag.removeAttribute('data-paused');
      }
    } else {
      console.debug('changing to station ' + newStation);
      this.playButton.disabled = false;
      this.pause();
      this.play(newStation);
      this.stationMenu.classList.remove('expanded');
    }
    if (firstListItem !== listItem) {
      this.moveListItemToTop(listItem);
      this.stationMenu.scrollTop = 0;
    }
    listItem.classList.remove('hidden');
  }

  getCurrentStation() {
    const listItem = this.stationMenu.querySelector('.selected');
    const link = listItem.querySelector('a');
    return this.getStationFromLink(link);
  }

  getStationFromLink(link) {
    const index = link.href.indexOf('#');
    return link.href.slice(index + 1);
  }

  onStationKeypress(event) {
    const keyCode = event.keyCode;
    if (keyCode !== 13) { // Enter
      return;
    }
    if (this.getCurrentStation() === '') {
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
      const selected = this.stationMenu.querySelector('li.selected');
      if (selected) {
        selected.classList.remove('selected');
        selected.classList.add('hidden');
        this.restoreListItemPosition(selected);
      }
      const link = this.stationMenu.
          querySelector('a[href="#' + station + '"]');
      const listItem = link.parentNode;
      listItem.classList.add('selected');
      listItem.classList.remove('hidden');
      this.moveListItemToTop(listItem);
      this.updateTrackInfo(station);
    }
  }

  pause() {
    console.debug('pausing...');
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
    this.stationMenu.focus();
    this.emit('pause', station);
  }

  play(station) {
    console.debug('playing...');
    if (typeof station !== 'string') {
      station = this.getCurrentStation();
    }
    this.resetTrackInfoIfNecessary(station);
    this.subscribe(station).then(() => {
      this.updateTrackInfo(station);
      this.socket.on('track', this.onTrack);
    }).catch(this.subscribeError.bind(this));
    const stationUrl = Config.soma_station_url + station;
    this.audioTag.src = stationUrl;
    this.audioTag.setAttribute('data-station', station);
    this.audioTag.removeAttribute('data-paused');
    this.playButton.classList.add('hidden');
    this.pauseButton.classList.remove('hidden');
    this.pauseButton.disabled = false;
    this.stationMenu.focus();
    this.emit('play', station, stationUrl);
  }

  resetTrackInfoIfNecessary(station) {
    if (this.audioTag.getAttribute('data-station') === station) {
      return;
    }
    this.hideTrackInfo();
  }

  subscribe(station) {
    if (this.socket && this.socket.connected) {
      console.debug('socket already defined and is connected');
      return this.emitSubscribe(station);
    }
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        console.debug('socket not yet defined');
        this.socket = require('socket.io-client')(Config.scrobbler_api_url);
      }
      console.debug('listening for socket connect');
      this.socket.on('connect', () => {
        this.emitSubscribe(station).then(resolve).catch(reject);
      });
    });
  }

  subscribeError(station, response) {
    console.error('failed to subscribe to ' + station, response);
  }

  unsubscribe(station) {
    console.debug('unsubscribing from ' + station);
    return new Promise((resolve, reject) => {
      if (!this.socket || !station) {
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
    console.debug('subscribing to ' + station);
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

  insertStationLinks(stations) {
    let index = 1;
    stations.forEach((station) => {
      this.stationMenu.appendChild(this.getStationListItem(index, station));
      index++;
    });
    this.stationMenu.classList.remove('disabled');
  }

  getStationListItem(index, station) {
    const listItem = document.createElement('li');
    listItem.className = 'hidden';
    listItem.setAttribute('data-index', index);
    listItem.appendChild(this.getStationLink(station));
    return listItem;
  }

  getStationLink(station) {
    const link = document.createElement('a');
    link.href = '#' + station.id;
    link.appendChild(this.getStationImage(station));
    link.appendChild(document.createTextNode(station.title));
    link.addEventListener('click', this.onStationLinkClick.bind(this));
    link.addEventListener('keypress', this.onStationKeypress.bind(this));
    return link;
  }

  getStationImage(station) {
    const img = document.createElement('img');
    img.src = '../images/' + station.id + '.png';
    img.alt = station.title + ' image';
    return img;
  }

  loadDefaultStations() {
    this.insertStationLinks(DefaultStations);
  }

  getStations() {
    return new Promise((resolve, reject) => {
      if (this.settings.stations && this.settings.stations.length > 0) {
        console.debug('loading cached list of stations');
        resolve(this.settings.stations);
      } else {
        console.debug('fetching stations list from SomaFM');
        const soma = new Soma();
        soma.getStations().then(this.saveStations.bind(this)).
                           then(resolve).catch(reject);
      }
    });
  }

  updateTrackInfo(station) {
    console.debug('getting track info for station ' + station);
    const soma = new Soma();
    soma.getStationInfo(station).then(this.showTrackInfo.bind(this)).
                                 catch(this.getStationInfoError.bind(this));
  }

  saveStations(stations) {
    console.debug('saving stations list');
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
      if (duration) {
        this.durationEl.textContent = duration;
        this.durationEl.classList.remove('hidden');
      } else {
        this.durationEl.classList.add('hidden');
      }
      if (track.album && track.album.length > 0) {
        this.albumEl.textContent = track.album;
        this.albumEl.classList.remove('hidden');
      } else {
        this.albumEl.classList.add('hidden');
      }
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
    let message = track.title;
    if (typeof track.artist === 'string' && track.artist.length > 0) {
      message += ' by ' + track.artist;
    }
    const station = this.getCurrentStation();
    const options = {
      title: track.title,
      body: message,
      icon: path.join(__dirname, '..', 'images', station + '.png')
    };
    new Notification(message, options);
  }

  scrobbleTrack(track) {
    if (!this.settings.lastfmSessionKey || !this.settings.lastfmUser ||
        !this.settings.scrobbling) {
      return;
    }
    const lastfm = new Lastfm();
    const auth = {
      user: this.settings.lastfmUser,
      sessionKey: this.settings.lastfmSessionKey
    };
    lastfm.scrobble(track, auth).then(this.onScrobbled.bind(this)).
                                 catch(this.onScrobbleError.bind(this));
  }

  onScrobbled(response) {
    const scrobble = response.scrobbles.scrobble;
    const title = scrobble.track['#text'];
    this.emit('notice', 'Scrobbled "' + title + '"!');
  }

  onScrobbleError(error) {
    console.error('failed to scrobble track', error);
    this.emit('error', 'Failed to scrobble track.');
  }
}
