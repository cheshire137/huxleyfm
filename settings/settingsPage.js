const Settings = require('../models/settings');
const Lastfm = require('../models/lastfm');
const Eventful = require('../models/eventful');
const Soma = require('../models/soma');

class SettingsPage extends Eventful {
  constructor(settings) {
    super();
    this.settings = settings;
    this.findElements();
    this.listenForChanges();
    this.listenForLastfmAuthenticateClicks();
    this.listenForRefreshStations();
    this.restoreSettings();
  }

  findElements() {
    this.lastfmConnected =
        document.getElementById('lastfm-is-authenticated');
    this.lastfmButtons = document.querySelectorAll('button.lastfm-auth');
    this.lastfmSessionButton = document.querySelector('.lastfm-get-session');
    this.lastfmIsAuthenticating =
        document.getElementById('lastfm-is-authenticating');
    this.disableScrobbling = document.getElementById('disable_scrobbling');
    this.enableScrobbling = document.getElementById('enable_scrobbling');
    this.disableNotifications =
        document.getElementById('disable_notifications');
    this.enableNotifications = document.getElementById('enable_notifications');
    this.lightTheme = document.getElementById('light_theme');
    this.darkTheme = document.getElementById('dark_theme');
    this.lastfmNotConnected =
        document.getElementById('lastfm-is-not-authenticated');
    this.lastfmUser = document.getElementById('lastfm-user');
    this.lastfmDisconnect = document.getElementById('lastfm-disconnect');
    this.stationsDivider = document.querySelector('.stations-divider');
    this.stationsOptions = document.querySelector('.stations-options');
    this.stationCount = document.querySelector('.station-count');
    this.stationsList = document.querySelector('.stations-list');
    this.refreshStationsButton =
        document.querySelector('button.refresh-stations');
  }

  listenForChanges() {
    const inputs = document.querySelectorAll('input[name="scrobbling"], ' +
                                             'input[name="notifications"], ' +
                                             'input[name="theme"]');
    Array.prototype.forEach.call(inputs, (input) => {
      input.addEventListener('change', (e) => {
        this.saveSettings();
      });
    });
  }

  listenForLastfmAuthenticateClicks() {
    Array.prototype.forEach.call(this.lastfmButtons, (button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.target.blur();
        this.authenticateLastfm();
      });
    });
    this.lastfmSessionButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.target.blur();
      this.getLastfmSession();
    });
    this.lastfmDisconnect.addEventListener('click', (e) => {
      e.preventDefault();
      e.target.blur();
      this.disconnectFromLastfm();
    });
  }

  listenForRefreshStations() {
    this.refreshStationsButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.target.blur();
      this.refreshStations();
    });
  }

  getLastfmSession() {
    const lastfm = new Lastfm();
    lastfm.getSession(this.token).
           then(this.onLastfmSessionLoaded.bind(this)).
           catch(this.onLastfmSessionLoadError.bind(this));
  }

  onLastfmSessionLoaded(session) {
    this.token = undefined;
    this.settings.lastfmSessionKey = session.key;
    this.settings.lastfmUser = session.name;
    this.settings.scrobbling = true;
    Settings.save(this.settings).
             then(this.onLastfmSessionSaved.bind(this)).
             catch(this.onSettingsSaveError.bind(this));
  }

  onLastfmSessionLoadError(err) {
    console.error('failed to get Last.fm session', err);
    this.emit('error', 'There was an error connecting with Last.fm.');
    this.lastfmIsAuthenticating.classList.add('hidden');
    this.lastfmNotConnected.classList.remove('hidden');
  }

  disconnectFromLastfm() {
    this.settings.lastfmSessionKey = null;
    this.settings.lastfmUser = null;
    this.settings.scrobbling = false;
    Settings.save(this.settings).
             then(this.onLastfmDisconnected.bind(this)).
             catch(this.onSettingsSaveError.bind(this));
  }

  authenticateLastfm() {
    const lastfm = new Lastfm();
    lastfm.authenticate().then(this.onLastfmAuthRequestMade.bind(this));
  }

  onLastfmAuthRequestMade(token) {
    this.token = token;
    this.lastfmNotConnected.classList.add('hidden');
    this.lastfmConnected.classList.add('hidden');
    this.lastfmIsAuthenticating.classList.remove('hidden');
  }

  onLastfmSessionSaved() {
    this.lastfmIsAuthenticating.classList.add('hidden');
    this.emit('notice', 'Connected to Last.fm!');
    this.restoreLastfmSessionSetting();
    this.restoreLastfmUserSetting();
    this.restoreScrobblingSetting();
  }

  onLastfmDisconnected() {
    this.lastfmConnected.classList.add('hidden');
    this.lastfmNotConnected.classList.remove('hidden');
    this.emit('notice', 'Disconnected from Last.fm!');
    this.restoreLastfmSessionSetting();
    this.restoreLastfmUserSetting();
    this.restoreScrobblingSetting();
  }

  restoreSettings() {
    this.restoreLastfmSessionSetting();
    this.restoreLastfmUserSetting();
    this.restoreScrobblingSetting();
    this.restoreNotificationsSetting();
    this.restoreStations();
    this.restoreThemeSetting();
    this.revealControls();
    this.revealLastfmButtons();
  }

  restoreStations() {
    if (this.settings.stations && this.settings.stations.length > 0) {
      this.showCachedStations(this.settings.stations);
    }
  }

  showCachedStations(stations) {
    this.stationsDivider.classList.remove('hidden');
    this.stationsOptions.classList.remove('hidden');
    this.stationCount.textContent = stations.length;
    const titles = stations.map((s) => s.title);
    titles.sort();
    const textList = titles.slice(0, titles.length - 1).join(', ') +
                     ', and ' + titles[titles.length - 1] + '.';
    this.stationsList.textContent = textList;
  }

  refreshStations() {
    this.stationsList.textContent = '';
    this.refreshStationsButton.disabled = true;
    const soma = new Soma();
    soma.getStations().then(this.saveStations.bind(this)).
                       catch(this.getStationsError.bind(this));
  }

  revealLastfmButtons() {
    Array.prototype.forEach.call(this.lastfmButtons, (button) => {
      button.classList.remove('hidden');
    });
  }

  revealControls() {
    const controls = document.querySelectorAll('.controls.hidden');
    Array.prototype.forEach.call(controls, (control) => {
      control.classList.remove('hidden');
    });
  }

  restoreLastfmSessionSetting() {
    if (this.settings.lastfmSessionKey) {
      this.lastfmConnected.classList.remove('hidden');
      this.enableScrobbling.disabled = false;
    } else {
      this.lastfmNotConnected.classList.remove('hidden');
    }
  }

  restoreLastfmUserSetting() {
    if (this.settings.lastfmUser) {
      this.lastfmUser.textContent = this.settings.lastfmUser;
      this.lastfmUser.href = 'http://last.fm/user/' + this.settings.lastfmUser;
    }
  }

  restoreNotificationsSetting() {
    if (this.settings.notifications === false) {
      this.disableNotifications.checked = true;
    }
  }

  restoreScrobblingSetting() {
    if (this.settings.scrobbling) {
      this.enableScrobbling.checked = true;
    }
  }

  restoreThemeSetting() {
    if (this.settings.theme === 'dark') {
      this.darkTheme.checked = true;
    }
  }

  saveStations(stations) {
    this.settings.stations = stations;
    this.refreshStationsButton.disabled = false;
    Settings.save(this.settings).then(() => {
      this.showCachedStations(stations);
      this.emit('settings:change', this.settings);
    }).catch(this.onSettingsSaveError.bind(this));
  }

  saveSettings() {
    this.settings.scrobbling = this.getScrobblingOption();
    this.settings.notifications = this.getNotificationsOption();
    this.settings.theme = this.getThemeOption();
    Settings.save(this.settings).
             then(this.onSettingsSaved.bind(this)).
             catch(this.onSettingsSaveError.bind(this));
  }

  getStationsError(error) {
    console.error('failed to get Soma stations', error);
    this.emit('error', 'Failed to get list of Soma stations.');
  }

  onSettingsSaveError(error) {
    console.error('failed to save settings', error);
    this.emit('error', 'Failed to save settings.');
  }

  onSettingsSaved() {
    this.emit('notice', 'Saved your settings!');
    this.emit('settings:change', this.settings);
  }

  getScrobblingOption() {
    const checked = document.querySelector('input[name="scrobbling"]:checked');
    return checked.value === 'enabled';
  }

  getNotificationsOption() {
    const checked = document.
        querySelector('input[name="notifications"]:checked');
    return checked.value === 'enabled';
  }

  getThemeOption() {
    const checked = document.querySelector('input[name="theme"]:checked');
    return checked.value;
  }
}

module.exports = SettingsPage
