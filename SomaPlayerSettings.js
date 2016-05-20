const Util = require('./SomaPlayerUtil');
const Lastfm = require('./Lastfm');

module.exports = class SomaPlayerSettings {
  constructor() {
    this.findElements();
    Util.getOptions().then(this.onOptionsLoaded.bind(this));
    this.listenForChanges();
    this.listenForLastfmAuthenticateClicks();
  }

  onOptionsLoaded(options) {
    this.options = options;
    this.restoreSettings();
    this.applyTheme();
  }

  applyTheme() {
    const theme = this.options.theme || 'light';
    document.body.classList.remove('theme-light');
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-' + theme);
  }

  findElements() {
    this.lastfmConnectedMessage =
        document.getElementById('lastfm-is-authenticated');
    this.statusArea = document.getElementById('status-message');
    this.lastfmButtons = document.querySelectorAll('button.lastfm-auth');
    this.disableScrobbling = document.getElementById('disable_scrobbling');
    this.enableScrobbling = document.getElementById('enable_scrobbling');
    this.disableNotifications =
        document.getElementById('disable_notifications');
    this.enableNotifications = document.getElementById('enable_notifications');
    this.lightTheme = document.getElementById('light_theme');
    this.darkTheme = document.getElementById('dark_theme');
    this.lastfmConnectedMessage =
        document.getElementById('lastfm-is-authenticated');
    this.lastfmNotConnectedMessage =
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
        this.authenticateLastfm();
      });
    });
  }

  authenticateLastfm() {
    const lastfm = new Lastfm();
    lastfm.authenticate();
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
    if (this.options.lastfmSessionKey) {
      this.lastfmConnectedMessage.classList.remove('hidden');
      this.enableScrobbling.disabled = false;
    } else {
      this.lastfmNotConnectedMessage.classList.remove('hidden');
    }
  }

  restoreLastfmUserSetting() {
    if (this.options.lastfmUser) {
      this.lastfmUser.textContent = this.options.lastfmUser;
      this.lastfmUser.href = 'http://last.fm/user/' + this.options.lastfmUser;
    }
  }

  restoreNotificationsSetting() {
    if (this.options.notifications === false) {
      this.disableNotifications.checked = true;
    }
  }

  restoreScrobblingSetting() {
    if (this.options.scrobbling) {
      this.enableScrobbling.checked = true;
    }
  }

  restoreThemeSetting() {
    if (this.options.theme === 'dark') {
      this.darkTheme.checked = true;
    }
  }

  saveSettings() {
    this.options.scrobbling = this.getScrobblingOption();
    this.options.notifications = this.getNotificationsOption();
    this.options.theme = this.getThemeOption();
    Util.setOptions(this.options).then(this.onSettingsSaved.bind(this));
  }

  onSettingsSaved() {
    this.statusArea.textContent = 'Saved your settings!';
    this.statusArea.classList.remove('hidden');
    window.scrollTo(0, 0);
    setTimeout(() => {
      this.statusArea.classList.add('hidden');
    }, 2000);
    this.applyTheme();
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
