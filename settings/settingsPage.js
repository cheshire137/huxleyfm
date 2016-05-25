const Settings = require('../models/settings');
const Lastfm = require('../models/lastfm');
const Eventful = require('../models/eventful');

class SettingsPage extends Eventful {
  constructor(settings) {
    super();
    this.settings = settings;
    this.findElements();
    this.listenForChanges();
    this.listenForLastfmAuthenticateClicks();
    this.restoreSettings();
  }

  findElements() {
    this.lastfmConnected =
        document.getElementById('lastfm-is-authenticated');
    this.statusArea = document.getElementById('status-message');
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
         then(this.onLastfmSessionSaved.bind(this));
  }

  onLastfmSessionLoadError(err) {
    console.error('failed to get Last.fm session', err);
    this.flashError('There was an error connecting with Last.fm.');
    this.lastfmIsAuthenticating.classList.add('hidden');
    this.lastfmNotConnected.classList.remove('hidden');
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
    this.flashMessage('Connected to Last.fm!');
    this.restoreLastfmSessionSetting();
    this.restoreLastfmUserSetting();
    this.restoreScrobblingSetting();
  }

  restoreSettings() {
    this.restoreLastfmSessionSetting();
    this.restoreLastfmUserSetting();
    this.restoreScrobblingSetting();
    this.restoreNotificationsSetting();
    this.restoreThemeSetting();
    this.revealControls();
    this.revealLastfmButtons();
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

  saveSettings() {
    this.settings.scrobbling = this.getScrobblingOption();
    this.settings.notifications = this.getNotificationsOption();
    this.settings.theme = this.getThemeOption();
    Settings.save(this.settings).then(this.onSettingsSaved.bind(this));
  }

  flashError(message) {
    this.flashMessage(message, true);
  }

  flashMessage(message, isError) {
    this.statusArea.textContent = message;
    if (isError) {
      this.statusArea.classList.add('error');
    } else {
      this.statusArea.classList.remove('error');
    }
    this.statusArea.classList.remove('hidden');
    window.scrollTo(0, 0);
    const delay = isError ? 10000 : 2000;
    setTimeout(() => {
      this.statusArea.classList.add('hidden');
      this.statusArea.textContent = '';
    }, delay);
  }

  onSettingsSaved() {
    this.flashMessage('Saved your settings!');
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
