const Settings = require('../models/settings');
const fs = require('fs');
const Router = require('../models/router');
const LinkHandler = require('../models/linkHandler');
const IndexPage = require('../index/indexPage');
const SettingsPage = require('../settings/settingsPage');
const FlashMessages = require('../models/flashMessages');

class PageLoader {
  constructor() {
    this.pageID = null;
    this.findElements();
    this.flashMessages = new FlashMessages(this.statusArea);
    Settings.load().then(this.onInitialSettingsLoad.bind(this));
  }

  findElements() {
    this.statusArea = document.getElementById('status-message');
  }

  onInitialSettingsLoad(settings) {
    this.settings = settings;
    this.setupRouter();
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
    const page = new IndexPage(this.settings);
    page.addListener('settings:change', (s) => this.onSettingsChanged(s));
    this.listenForPageMessages(page);
  }

  onSettingsPageLoaded() {
    const page = new SettingsPage(this.settings);
    page.addListener('settings:change', (s) => this.onSettingsChanged(s));
    this.listenForPageMessages(page);
  }

  onAboutPageLoaded() {
  }

  listenForPageMessages(page) {
    page.addListener('error', (e) => this.flashMessages.error(e));
    page.addListener('notice', (m) => this.flashMessages.notice(m));
  }

  onSettingsChanged(settings) {
    this.settings = settings;
    this.applyTheme(settings.theme);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  new PageLoader();
});
