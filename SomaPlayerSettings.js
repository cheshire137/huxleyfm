const Util = require('./SomaPlayerUtil');

module.exports = class SomaPlayerSettings {
  constructor() {
    this.findElements();
    Util.getOptions().then(this.onOptionsLoaded.bind(this));
    this.listenForChanges();
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
    this.lastfmButton = document.querySelector('button.lastfm-auth');
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

  restoreSettings() {
    this.restoreLastfmSessionSetting();
    this.restoreLastfmUserSetting();
    this.restoreScrobblingSetting();
    this.restoreNotificationsSetting();
    this.restoreThemeSetting();
    const controls = document.querySelectorAll('.controls.hidden');
    Array.prototype.forEach.call(controls, (control) => {
      control.classList.remove('hidden');
    });
    this.lastfmButton.classList.remove('hidden');
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
    console.log('save settings');
  }
}
