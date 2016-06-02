const path = require('path');
const { ipcRenderer } = require('electron');
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
  constructor(settings, audioTag, lastNotifiedSongID) {
    console.debug('index page init');
    super();
    this.settings = settings;
    this.audioTag = audioTag;
    this.chromecasting = false;
    this.onTrack = __bind(this.onTrack, this);
    this.onStationLinkClick = __bind(this.onStationLinkClick, this);
    this.play = __bind(this.play, this);
    this.pause = __bind(this.pause, this);
    this.onKeydown = __bind(this.onKeydown, this);
    this.stationQuery = '';
    this.lastNotifiedSongID = lastNotifiedSongID;
    this.soma = new Soma();
    this.findElements();
    this.listenForMusicChanges();
    this.getStations().then(this.insertStationLinks.bind(this)).
                       then(this.restorePlayingInfo.bind(this)).
                       catch(this.loadDefaultStations.bind(this));
    this.listenForMediaKeys();
  }

  removeListeners() {
    console.debug('unbinding index page listeners');
    ipcRenderer.removeAllListeners('media-key');
    const stationLinks = this.stationMenu.querySelectorAll('a');
    Array.prototype.forEach.call(stationLinks, (link) => {
      link.removeEventListener('click', this.onStationLinkClick);
    });
    this.playButton.removeEventListener('click', this.play);
    this.pauseButton.removeEventListener('click', this.pause);
    window.removeEventListener('keydown', this.onKeydown);
    if (this.songListInterval) {
      clearInterval(this.songListInterval);
    }
    if (this.stationInfoInterval) {
      clearInterval(this.stationInfoInterval);
    }
  }

  findElements() {
    this.stationMenu = document.getElementById('station-menu');
    this.playButton = document.getElementById('play');
    this.pauseButton = document.getElementById('pause');
    this.stationQueryEl = document.getElementById('station-query');
    this.lastUpdatedEl = document.getElementById('last-updated');
    this.startTimeEl = document.getElementById('start-time');
    this.songsList = document.getElementById('songs-list');
    this.djName = document.getElementById('dj-name');
    this.listenerCount = document.getElementById('listener-count');
  }

  listenForMediaKeys() {
    ipcRenderer.on('media-key', (event, key) => {
      if (key === 'MediaPlayPause') {
        this.togglePlaying();
      } else if (key === 'MediaStop') {
        this.pause();
      }
    });
  }

  listenForMusicChanges() {
    const stationLinks = this.stationMenu.querySelectorAll('a');
    Array.prototype.forEach.call(stationLinks, (link) => {
      link.addEventListener('click', this.onStationLinkClick);
    });
    this.playButton.addEventListener('click', this.play);
    this.pauseButton.addEventListener('click', this.pause);
    window.addEventListener('keydown', this.onKeydown);
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
    this.handleStationLinkClick(link);
  }

  expandStationMenu(listItems) {
    console.debug('expanding station menu');
    if (typeof listItems === 'undefined') {
      listItems = Array.from(this.stationMenu.querySelectorAll('li'));
    }
    listItems.forEach(li => li.classList.remove('hidden'));
    this.stationMenu.classList.add('expanded');
  }

  collapseStationMenu(listItems) {
    console.debug('collapsing station menu');
    if (typeof listItems === 'undefined') {
      listItems = Array.from(this.stationMenu.querySelectorAll('li'));
    }
    listItems.forEach(li => li.classList.add('hidden'));
    this.stationMenu.classList.remove('expanded');
  }

  handleStationLinkClick(link) {
    const listItem = link.closest('li');
    const listItems = Array.from(this.stationMenu.querySelectorAll('li'));
    const chooseStationListItem = this.stationMenu.
        querySelector('li[data-index="0"]');
    if (chooseStationListItem) {
      chooseStationListItem.remove();
    }
    listItems.forEach(li => li.classList.remove('selected'));
    listItem.classList.add('selected');
    const newStation = this.getStationFromLink(link);
    const oldStation = this.audioTag.getAttribute('data-station');
    let firstListItem = this.stationMenu.querySelector('li:first-child');
    if (firstListItem !== listItem) {
      this.restoreListItemPosition(firstListItem);
    }
    if (newStation === oldStation || newStation === '') {
      if (this.stationMenu.classList.contains('expanded')) {
        this.collapseStationMenu(listItems);
      } else {
        this.expandStationMenu(listItems);
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

  restorePlayingInfo() {
    const station = this.audioTag.hasAttribute('data-station') ?
        this.audioTag.getAttribute('data-station') : null;
    if (!station) {
      return;
    }
    const isPaused = this.audioTag.getAttribute('data-paused') === 'true';
    console.debug('restore playing info', station,
                  isPaused ? 'paused' : 'playing');
    if (isPaused) {
      this.pauseButton.classList.add('hidden');
      this.playButton.classList.remove('hidden');
      this.playButton.disabled = false;
    } else {
      this.playButton.classList.add('hidden');
      this.pauseButton.classList.remove('hidden');
      this.pauseButton.disabled = false;
    }
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
    this.getSongsList(station);
    this.getStationInfo(station);
  }

  pause() {
    console.debug('pausing...');
    const station = this.audioTag.getAttribute('data-station');
    this.audioTag.pause();
    this.audioTag.currentTime = 0;
    this.audioTag.setAttribute('data-paused', 'true');
    this.pauseButton.classList.add('hidden');
    this.playButton.classList.remove('hidden');
    const currentStation = this.getCurrentStation();
    if (currentStation.length > 0) {
      this.playButton.disabled = false;
    }
    this.emit('pause', station);
  }

  togglePlaying() {
    const station = this.getCurrentStation();
    if (station.length < 1) {
      return;
    }
    if (this.audioTag.getAttribute('data-paused') === 'true') {
      this.play(station);
    } else {
      this.pause();
    }
  }

  play(station) {
    console.debug('playing...');
    if (typeof station !== 'string') {
      station = this.getCurrentStation();
    }
    this.resetTrackInfoIfNecessary(station);
    const stationUrl = Config.soma_station_url + station;
    if (!process.env.DISABLE_PLAYING && !this.chromecasting) {
      this.audioTag.src = stationUrl;
    }
    this.audioTag.setAttribute('data-station', station);
    this.audioTag.removeAttribute('data-paused');
    this.playButton.classList.add('hidden');
    this.pauseButton.classList.remove('hidden');
    this.pauseButton.disabled = false;
    this.emit('play', station, stationUrl);
    this.getSongsList(station);
    this.getStationInfo(station);
  }

  emptySongsList() {
    const listItems = Array.from(this.songsList.querySelectorAll('li'));
    listItems.forEach(li => li.remove());
  }

  getStationInfo(station) {
    if (this.stationInfoInterval) {
      clearInterval(this.stationInfoInterval);
    }
    const getter = () => {
      console.debug('refreshing station info for ' + station);
      this.soma.getStationInfo(station).
                then(this.onStationInfoLoaded.bind(this)).
                catch(this.onStationInfoError.bind(this));
    };
    const seconds = 5 * 60;
    this.stationInfoInterval = setInterval(getter, seconds * 1000);
    getter();
  }

  getSongsList(station) {
    if (this.songListInterval) {
      clearInterval(this.songListInterval);
    }
    this.emptySongsList();
    const getter = () => {
      console.debug('refreshing songs list for ' + station);
      this.soma.getStationSongs(station).
           then(this.onSongListLoaded.bind(this)).
           catch(this.onSongListLoadError.bind(this, station));
    };
    const seconds = 30;
    this.songListInterval = setInterval(getter, seconds * 1000);
    getter();
  }

  onStationInfoLoaded(info) {
    if (typeof info.dj === 'string' && info.dj.length > 0) {
      this.djName.textContent = info.dj;
      this.djName.classList.remove('hidden');
    }
    if (typeof info.listeners === 'string') {
      this.listenerCount.textContent = info.listeners;
      this.listenerCount.classList.remove('hidden');
    }
  }

  onStationInfoError(error) {
    console.error('failed to load station info', error);
    this.emit('error', 'Could not load station info.');
  }

  onSongListLoaded(songs) {
    if (songs.length < 1) {
      return;
    }
    const latestSong = songs[songs.length - 1];
    const latestSongListItem = document.getElementById(latestSong.id);
    const isNewSong = !latestSongListItem;
    songs.forEach((song) => {
      let listItem = document.getElementById(song.id);
      if (!listItem) {
        listItem = this.getSongListItem(song);
        const firstItem = this.songsList.firstChild;
        if (firstItem) {
          this.songsList.insertBefore(listItem, firstItem);
        } else {
          this.songsList.appendChild(listItem);
        }
      }
    });
    if (isNewSong) {
      this.emit('song', latestSong);
      this.notifyAboutTrack(latestSong);
      this.scrobbleTrack(latestSong);
    }
  }

  getSongListItem(song) {
    const listItem = document.createElement('li');
    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = song.title;
    listItem.appendChild(title);
    const artist = document.createElement('span');
    artist.className = 'artist';
    artist.textContent = song.artist;
    listItem.appendChild(artist);
    if (typeof song.album === 'string' && song.album.length > 0) {
      const album = document.createElement('span');
      album.className = 'album';
      album.textContent = song.album;
      listItem.appendChild(album);
    }
    if (song.date instanceof Date) {
      const date = document.createElement('span');
      date.className = 'date';
      date.textContent = this.dateToStr(song.date);
      listItem.appendChild(date);
    }
    listItem.id = song.id;
    return listItem;
  }

  onSongListLoadError(station, error) {
    console.error('failed to load list of songs playing on station', station,
                  error);
    this.emit('error', 'Could not get recent track list.');
  }

  resetTrackInfoIfNecessary(station) {
    if (this.audioTag.getAttribute('data-station') === station) {
      return;
    }
    this.emptySongsList();
    this.djName.textContent = '';
    this.djName.classList.add('hidden');
    this.listenerCount.textContent = '';
    this.listenerCount.classList.add('hidden');
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
    link.addEventListener('click', this.onStationLinkClick);
    link.setAttribute('data-tooltip', this.getStationDescription(station.id));
    return link;
  }

  getStationDescription(id) {
    for (let i = 0; i < DefaultStations.length; i++) {
      const station = DefaultStations[i];
      if (station.id === id) {
        return station.description;
      }
    }
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
        this.soma.getStations(true).then(this.saveStations.bind(this)).
                                    then(resolve).catch(reject);
      }
    });
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

  dateToStr(date) {
    let hours = date.getHours();
    let amPM = 'am';
    if (hours >= 12) {
      amPM = 'pm';
    }
    if (hours > 12) {
      hours = hours - 12;
    }
    let minutes = date.getMinutes();
    if (minutes < 10) {
      minutes = '0' + minutes;
    }
    return hours + ':' + minutes + ' ' + amPM;
  }

  notifyAboutTrack(song) {
    if (!this.settings.notifications) {
      return;
    }
    if (this.lastNotifiedSongID === song.id) {
      return;
    }
    const station = this.getCurrentStation();
    if (station.length < 1) {
      return;
    }
    if (this.audioTag.getAttribute('data-paused') === 'true') {
      return;
    }
    let message = song.title;
    if (typeof song.artist === 'string' && song.artist.length > 0) {
      message += ' by ' + song.artist;
    }
    const options = {
      title: song.title,
      body: message,
      icon: path.join(__dirname, '..', 'images', station + '.png')
    };
    this.lastNotifiedSongID = song.id;
    new Notification(message, options);
  }

  scrobbleTrack(song) {
    if (!this.settings.lastfmSessionKey || !this.settings.lastfmUser ||
        !this.settings.scrobbling) {
      return;
    }
    if (this.getCurrentStation().length < 1) {
      return;
    }
    if (this.audioTag.getAttribute('data-paused') === 'true') {
      return;
    }
    const lastfm = new Lastfm();
    const auth = {
      user: this.settings.lastfmUser,
      sessionKey: this.settings.lastfmSessionKey
    };
    lastfm.scrobble(song, auth).
           then(this.onScrobbled.bind(this)).
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

  updateStationQuery(query) {
    this.stationQuery = query;
    this.stationQueryEl.textContent = this.stationQuery;
    if (query.length > 0) {
      this.stationQueryEl.classList.remove('hidden');
    } else {
      this.stationQueryEl.classList.add('hidden');
    }
  }

  onKeydown(event) {
    const keyCode = event.keyCode || event.charCode;
    if (keyCode !== 8 && keyCode !== 13 && keyCode !== 27 &&
        (keyCode < 65  || keyCode > 90)) {
      return;
    }
    if (!this.stationMenu.classList.contains('expanded')) {
      this.updateStationQuery('');
      this.filterStations();
      this.expandStationMenu();
    }
    if (keyCode === 27) { // Esc
      this.updateStationQuery('');
      this.filterStations();
      this.collapseStationMenu();
      this.stationMenu.querySelector('li:first-child').classList.
           remove('hidden');
    } else if (keyCode === 8) { // Backspace
      this.updateStationQuery(this.stationQuery.
                                   slice(0, this.stationQuery.length - 1));
      this.filterStations();
    } else if (keyCode === 13) { // Enter
      const listItems = Array.from(this.stationMenu.querySelectorAll('li'));
      const topListItem = listItems.filter((li) => {
        return li.getAttribute('data-index') !== '0' &&
               !li.classList.contains('hidden');
      })[0];
      if (topListItem) {
        const link = topListItem.querySelector('a');
        this.updateStationQuery('');
        this.filterStations();
        this.handleStationLinkClick(link);
      }
    } else if (keyCode >= 65 && keyCode <= 90) {
      const char = String.fromCharCode(keyCode).toLowerCase();
      this.updateStationQuery(this.stationQuery + char);
      this.filterStations();
    }
  }

  filterStations() {
    const stationLinks = this.stationMenu.querySelectorAll('a');
    Array.prototype.forEach.call(stationLinks, (link) => {
      const stationName = link.textContent;
      const listItem = link.closest('li');
      if (stationName.toLowerCase().indexOf(this.stationQuery) < 0) {
        listItem.classList.add('hidden');
      } else {
        listItem.classList.remove('hidden');
      }
    });
  }

  onChromecastStatus(status) {
    if (status.playerState === 'PLAYING') {
      this.chromecasting = true;
      this.audioTag.pause();
      this.audioTag.currentTime = 0;
    }
  }

  onChromecastDisconnect() {
    this.chromecasting = false;
    if (this.audioTag.hasAttribute('data-station') &&
        !this.audioTag.hasAttribute('data-paused')) {
      const stationUrl = Config.soma_station_url +
                         this.audioTag.getAttribute('data-station');
      if (!process.env.DISABLE_PLAYING) {
        this.audioTag.src = stationUrl;
      }
    }
  }
};
