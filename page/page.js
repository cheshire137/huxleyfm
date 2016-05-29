const Settings = require('../models/settings');
const fs = require('fs');
const Router = require('../models/router');
const LinkHandler = require('../models/linkHandler');
const IndexPage = require('../index/indexPage');
const SettingsPage = require('../settings/settingsPage');
const FlashMessages = require('../models/flashMessages');
// const Client = require('castv2-client').Client;
// const DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
// const mdns = require('mdns');
const AppMenu = require('../models/appMenu');

class PageLoader {
  constructor() {
    this.pageID = null;
    this.station = null;
    this.findElements();
    this.flashMessages = new FlashMessages(this.statusArea);
    Settings.load().then(this.onInitialSettingsLoad.bind(this));
    this.listenForCast();
    this.setupAppMenu();
  }

  findElements() {
    this.statusArea = document.getElementById('status-message');
    this.audioTag = document.querySelector('audio');
    this.chromecastWrapper = document.getElementById('chromecast-wrapper');
    this.chromecastLink = this.chromecastWrapper.querySelector('a');
    this.chromecastIcon = this.chromecastLink.querySelector('.material-icons');
    this.returnLinkWrapper = document.getElementById('return-link-wrapper');
  }

  onInitialSettingsLoad(settings) {
    this.settings = settings;
    this.setupRouter();
  }

  listenForCast() {
    this.chromecastLink.addEventListener('click', this.onChromecast.bind(this));
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
    this.linkHandler = new LinkHandler();
    this.linkHandler.
         addListener('page:load', (p, id) => this.router.loadPage(p, id));
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
    const page = new IndexPage(this.settings, this.audioTag);
    this.listenForPageMessages(page);
    page.addListener('play', this.onPlay.bind(this));
    page.addListener('pause', this.onPause.bind(this));
    this.hideBackLink();
  }

  onSettingsPageLoaded() {
    const page = new SettingsPage(this.settings);
    this.listenForPageMessages(page);
    this.showBackLink();
  }

  onAboutPageLoaded() {
    this.showBackLink();
  }

  listenForPageMessages(page) {
    page.addListener('settings:change', (s) => this.onSettingsChanged(s));
    page.addListener('error', (e) => this.flashMessages.error(e));
    page.addListener('notice', (m) => this.flashMessages.notice(m));
  }

  onPlay(station, url) {
    this.station = station;
    this.showChromecastLink();
  }

  onPause(station) {
    this.station = null;
    this.hideChromecastLink();
  }

  onChromecast() {
    console.log('onChromecast');
  }

  onSettingsChanged(settings) {
    this.settings = settings;
    this.applyTheme(settings.theme);
  }

  anyHeaderItemsShown() {
    return !this.chromecastWrapper.classList.contains('hidden') ||
           !this.returnLinkWrapper.classList.contains('hidden');
  }

  hideBackLink() {
    this.returnLinkWrapper.classList.add('hidden');
    if (!this.anyHeaderItemsShown()) {
      this.returnLinkWrapper.closest('header').classList.add('hidden');
    }
  }

  showBackLink() {
    this.returnLinkWrapper.classList.remove('hidden');
    this.returnLinkWrapper.closest('header').classList.remove('hidden');
  }

  hideChromecastLink() {
    this.chromecastWrapper.classList.add('hidden');
    if (!this.anyHeaderItemsShown()) {
      this.chromecastWrapper.closest('header').classList.add('hidden');
    }
  }

  showChromecastLink() {
    this.chromecastWrapper.classList.remove('hidden');
    this.chromecastWrapper.closest('header').classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  new PageLoader();
});
