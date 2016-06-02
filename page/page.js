const Settings = require('../models/settings');
const Router = require('../models/router');
const LinkHandler = require('../models/linkHandler');
const IndexPage = require('../index/index-page');
const SettingsPage = require('../settings/settings-page');
const AboutPage = require('../about/about-page');
const FlashMessages = require('../models/flashMessages');
const AppMenu = require('../models/appMenu');
const ChromecastScanner = require('../models/chromecastScanner');
const Chromecast = require('../models/chromecast');
const {ipcRenderer} = require('electron');

const __bind = function(fn, me) {
  return function() {
    return fn.apply(me, arguments);
  };
};

class PageLoader {
  constructor() {
    console.debug('page loader init');
    this.pageID = null;
    this.page = null;
    this.stationUrl = null;
    this.station = null;
    this.song = null;
    this.onPageLoad = __bind(this.onPageLoad, this);
    this.findElements();
    this.flashMessages = new FlashMessages(this.statusArea);
    Settings.load().then(this.onInitialSettingsLoad.bind(this));
    this.listenForCast();
    this.setupAppMenu();
    this.listenForQuit();
  }

  findElements() {
    this.statusArea = document.getElementById('status-message');
    this.audioTag = document.querySelector('audio');
    this.chromecastWrapper = document.getElementById('chromecast-wrapper');
    this.chromecastLink = document.getElementById('chromecast-link');
    this.chromecastIcon = this.chromecastLink.querySelector('.material-icons');
    this.returnLinkWrapper = document.getElementById('return-link-wrapper');
    this.settingsLinkWrapper = document.getElementById('settings-wrapper');
    this.aboutLinkWrapper = document.getElementById('about-wrapper');
    this.chromecastList = document.getElementById('chromecast-list');
  }

  onInitialSettingsLoad(settings) {
    this.settings = settings;
    this.setupRouter();
  }

  listenForCast() {
    this.chromecastLink.
         addEventListener('click', this.onChromecastClick.bind(this));
  }

  listenForQuit() {
    ipcRenderer.on('quit', () => {
      if (this.chromecast) {
        this.chromecast.stop();
        this.chromecast.close();
      }
    });
  }

  setupAppMenu() {
    const menu = new AppMenu();
    menu.addListener('about-app', () => {
      this.router.loadPage('about/about.html', 'about');
    });
    menu.addListener('preferences', () => {
      this.router.loadPage('settings/settings.html', 'settings');
    });
  }

  setupRouter() {
    this.router = new Router();
    this.router.addListener('page:loaded', (id, d) => this.onPageLoaded(id, d));
    this.router.loadPage('index/index.html', 'player');
  }

  onPageLoaded(pageID, data) {
    if (this.page && pageID !== this.pageID) {
      this.page.removeListeners();
    }
    this.updatePageClass(pageID);
    document.getElementById('page-container').innerHTML = data;
    this.handleLinks();
    this.applyTheme(this.settings.theme);
    this.initPage(pageID);
  }

  initPage(pageID) {
    if (pageID === 'player') {
      this.onIndexPageLoaded();
    } else if (pageID === 'settings') {
      this.onSettingsPageLoaded();
    } else if (pageID === 'about') {
      this.onAboutPageLoaded();
    }
  }

  handleLinks() {
    if (this.linkHandler) {
      this.linkHandler.removeListener('page:load', this.onPageLoad);
    }
    this.linkHandler = new LinkHandler();
    this.linkHandler.addListener('page:load', this.onPageLoad);
  }

  onPageLoad(p, id) {
    this.router.loadPage(p, id);
  }

  updatePageClass(pageID) {
    if (this.pageID) {
      document.body.classList.remove(this.pageID);
    }
    this.pageID = pageID;
    document.body.classList.add(pageID);
  }

  applyTheme(theme) {
    document.body.classList.remove('theme-light');
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-' + (theme || 'light'));
  }

  onIndexPageLoaded() {
    if (this.page && this.page instanceof IndexPage) {
      return;
    }
    let lastNotifiedSongID = null;
    if (this.song) {
      lastNotifiedSongID = this.song.id;
    }
    this.page = new IndexPage(this.settings, this.audioTag, lastNotifiedSongID);
    this.listenForPageMessages();
    this.page.addListener('play', this.onPlay.bind(this));
    this.page.addListener('pause', this.onPause.bind(this));
    this.page.addListener('song', this.onSong.bind(this));
    this.returnLinkWrapper.classList.add('hidden');
    this.settingsLinkWrapper.classList.remove('hidden');
    this.aboutLinkWrapper.classList.remove('hidden');
  }

  onSettingsPageLoaded() {
    if (this.page && this.page instanceof SettingsPage) {
      return;
    }
    this.page = new SettingsPage(this.settings);
    this.listenForPageMessages();
    this.returnLinkWrapper.classList.remove('hidden');
    this.settingsLinkWrapper.classList.add('hidden');
    this.aboutLinkWrapper.classList.add('hidden');
  }

  onAboutPageLoaded() {
    if (this.page && this.page instanceof AboutPage) {
      return;
    }
    this.page = new AboutPage();
    this.listenForPageMessages();
    this.returnLinkWrapper.classList.remove('hidden');
    this.settingsLinkWrapper.classList.add('hidden');
    this.aboutLinkWrapper.classList.add('hidden');
  }

  listenForPageMessages() {
    this.page.addListener('settings:change', (s) => this.onSettingsChanged(s));
    this.page.addListener('error', (e) => this.flashMessages.error(e));
    this.page.addListener('notice', (m) => this.flashMessages.notice(m));
  }

  onPlay(station, url) {
    this.stationUrl = url;
    this.station = station;
    console.debug('playing', this.stationUrl);
    this.chromecastWrapper.classList.remove('hidden');
    if (this.chromecast) {
      if (this.chromecast.url === this.stationUrl) {
        this.chromecast.play();
      } else {
        this.setupChromecast(this.chromecast.host, this.stationUrl);
      }
    }
  }

  onPause(station) {
    if (this.chromecast) {
      this.chromecast.pause();
    }
  }

  onSong(song) {
    console.debug('new song', song.title, 'by', song.artist);
    this.song = song;
    // TODO: figure out how to update song title on Chromecast without
    // pausing the music.
    // if (this.chromecast) {
    //   let title = this.song.title;
    //   if (typeof this.song.artist === 'string' && this.song.artist.length > 0) {
    //     title += ' by ' + this.song.artist;
    //   }
    //   this.chromecast.updateMedia({ title: title });
    // }
  }

  onChromecastClick(event) {
    event.preventDefault();
    this.chromecastLink.blur();
    if (this.chromecastLink.classList.contains('disabled')) {
      return;
    }
    if (this.chromecastIcon.textContent === 'cast_connected') {
      if (this.chromecast) {
        this.disconnectFromChromecast();
      }
    } else {
      if (this.chromecastList.querySelectorAll('li').length > 0) {
        if (this.chromecastList.classList.contains('hidden')) {
          this.chromecastList.classList.remove('hidden');
        } else {
          this.chromecastList.classList.add('hidden');
        }
      } else {
        this.listChromecasts();
      }
    }
  }

  disconnectFromChromecast() {
    this.chromecast.stop();
    this.chromecast.close();
    this.chromecastIcon.textContent = 'cast';
    if (this.page && typeof this.page.onChromecastDisconnect === 'function') {
      this.page.onChromecastDisconnect();
    }
  }

  listChromecasts() {
    const listItems = Array.from(this.chromecastList.querySelectorAll('li'));
    listItems.forEach(li => li.remove());
    this.chromecastLink.classList.add('disabled');
    this.chromecastIcon.textContent = 'refresh';
    this.chromecastIcon.classList.add('spin');
    this.chromecastScanner = new ChromecastScanner();
    this.chromecastScanner.addListener('chromecast',
                                       this.onChromecastFound.bind(this));
    this.chromecastScanner.addListener('error',
                                       this.onChromecastFindError.bind(this));
    this.chromecastScanner.
         addListener('finished', this.onChromecastScanComplete.bind(this));
    this.chromecastScanner.findChromecasts();
  }

  onChromecastFound(chromecast) {
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    link.textContent = chromecast.name.replace(/\.local$/, '');
    link.href = '#';
    link.setAttribute('data-host', chromecast.data);
    link.addEventListener('click', this.onChromecastSelected.bind(this));
    listItem.appendChild(link);
    this.chromecastList.appendChild(listItem);
    this.chromecastList.classList.remove('hidden');
  }

  onChromecastScanComplete() {
    console.log('chromecast scan complete');
    this.chromecastLink.classList.remove('disabled');
    this.chromecastIcon.classList.remove('spin');
    if (this.chromecastIcon.textContent === 'refresh') {
      this.chromecastIcon.textContent = 'cast';
    }
  }

  onChromecastFindError(error) {
    console.error('failed to find Chromecasts', error);
    this.chromecastLink.classList.remove('disabled');
    this.chromecastIcon.classList.remove('spin');
    this.chromecastIcon.textContent = 'cast';
  }

  onChromecastSelected(event) {
    event.preventDefault();
    const link = event.target;
    link.blur();
    this.chromecastLink.classList.add('pulse');
    this.chromecastLink.classList.remove('disabled');
    this.chromecastIcon.classList.remove('spin');
    this.chromecastIcon.textContent = 'cast';
    this.chromecastList.classList.add('hidden');
    if (this.chromecastScanner) {
      this.chromecastScanner.close();
    }
    this.chromecastLink.setAttribute('title', 'Casting to ' + link.textContent);
    this.setupChromecast(link.getAttribute('data-host'), this.stationUrl);
  }

  setupChromecast(host, url) {
    console.debug('setting up Chromecast ' + host + ' to play ' + url);
    const stationInfo = this.settings.stations.
                             filter((s) => s.id === this.station)[0];
    this.chromecast = new Chromecast({
      host: host,
      url: url,
      title: stationInfo ? stationInfo.title : null,
      imageUrl: stationInfo ? stationInfo.imageUrl : null
    });
    this.chromecast.addListener('connected',
                                this.onChromecastConnected.bind(this));
    this.chromecast.addListener('launched',
                                this.onChromecastLaunched.bind(this));
    this.chromecast.addListener('error', this.onChromecastError.bind(this));
    this.chromecast.addListener('close', this.onChromecastClose.bind(this));
    this.chromecast.addListener('status', this.onChromecastStatus.bind(this));
    this.chromecast.addListener('player-loaded',
                                this.onChromecastPlayerLoaded.bind(this));
    this.chromecast.addListener('play', this.onChromecastStatus.bind(this));
    this.chromecast.addListener('pause', this.onChromecastStatus.bind(this));
    this.chromecast.addListener('stop', this.onChromecastStatus.bind(this));
    this.chromecast.connect();
  }

  onChromecastConnected() {
  }

  onChromecastClose() {
    this.chromecastIcon.textContent = 'cast';
  }

  onChromecastLaunched(player) {
    this.chromecastIcon.textContent = 'cast_connected';
  }

  onChromecastError(error) {
  }

  onChromecastStatus(status) {
    console.debug('Chromecast', status.playerState, status.media ? status.media.contentId : 'unknown URL', 'volume ' + status.volume.level, status.volume.muted ? 'muted' : 'not muted');
    if (status.playerState !== 'BUFFERING') {
      this.chromecastLink.classList.remove('pulse');
    }
    if (this.page && typeof this.page.onChromecastStatus === 'function') {
      this.page.onChromecastStatus(status);
    }
  }

  onChromecastPlayerLoaded(status) {
    this.onChromecastStatus(status);
  }

  onSettingsChanged(settings) {
    this.settings = settings;
    this.applyTheme(settings.theme);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  new PageLoader();
});
