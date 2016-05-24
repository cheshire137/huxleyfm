const Settings = require('./models/settings');
const IndexPage = require('./index/indexPage');
const SettingsPage = require('./settings/settingsPage');
const fs = require('fs');
const shell = require('electron').shell;

class PageLoader {
  constructor() {
    this.priorPageID = null;
    this.loadPage('index/index.html', 'player').
         then(this.onIndexPageLoaded.bind(this));
  }

  onIndexPageLoaded() {
    new IndexPage(this.settings);
  }

  onSettingsPageLoaded() {
    const settingsPage = new SettingsPage(this.settings);
    settingsPage.addListener('settings:change',
                             this.onSettingsChanged.bind(this));
  }

  onAboutPageLoaded() {
  }

  onSettingsChanged(settings) {
    this.settings = settings;
    this.applyTheme(settings.theme);
  }

  onSettingsLoaded(pageID, settings) {
    this.settings = settings;
    this.applyTheme(settings.theme);
    if (pageID === 'player') {
      this.onIndexPageLoaded();
    } else if (pageID === 'settings') {
      this.onSettingsPageLoaded();
    } else if (pageID === 'about') {
      this.onAboutPageLoaded();
    }
  }

  applyTheme(theme) {
    document.body.classList.remove('theme-light');
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-' + (theme || 'light'));
  }

  onPageLoaded(pageID, data) {
    if (this.priorPageID) {
      document.body.classList.remove(this.priorPageID);
    }
    this.priorPageID = pageID;
    document.body.classList.add(pageID);
    document.getElementById('page-container').innerHTML = data;
    this.handleLinks();
    Settings.load().then(this.onSettingsLoaded.bind(this, pageID));
  }

  onPageLoadError(path, err) {
    console.error('failed to load page', path, err);
  }

  loadPage(path, pageID) {
    return this.loadPageContent(path).
                then(this.onPageLoaded.bind(this, pageID)).
                catch(this.onPageLoadError.bind(this, path));
  }

  loadPageContent(path) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  onInternalLinkClick(e) {
    e.preventDefault();
    let link = e.target;
    if (link.nodeName !== 'A') {
      link = link.closest('a');
    }
    const path = link.getAttribute('data-page-path');
    const pageID = link.getAttribute('data-page-id');
    this.loadPage(path, pageID);
  }

  onExternalLinkClick(url, e) {
    e.preventDefault();
    shell.openExternal(url);
  }

  handleLink(link) {
    const url = link.href;
    if (url.indexOf('http') === 0) {
      link.addEventListener('click', this.onExternalLinkClick.bind(this, url));
    } else {
      link.addEventListener('click', this.onInternalLinkClick.bind(this));
    }
  }

  handleLinks() {
    Array.prototype.forEach.call(document.querySelectorAll('a[href]'),
                                 this.handleLink.bind(this));
  }
}

document.addEventListener('DOMContentLoaded', function() {
  new PageLoader();
});
