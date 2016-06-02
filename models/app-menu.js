const { remote, shell } = require('electron');
const { Menu } = remote;
const Eventful = require('./eventful');
const Config = require('../config.json');

module.exports = class AppMenu extends Eventful {
  constructor() {
    super();
    this.template = [];
    this.buildMenu();
    Menu.setApplicationMenu(Menu.buildFromTemplate(this.template));
  }

  buildMenu() {
    const app = require('electron').remote.app;
    const name = app.getName();
    const self = this;
    const aboutOption = {
      label: `About ${name}`,
      click() { self.emit('about-app'); }
    };
    const bugReportOption = {
      label: 'Report a bug',
      click() { shell.openExternal(Config.new_bug_report_url); }
    };
    if (process.platform === 'darwin') {
      this.buildOSXMenu(app, name, aboutOption, bugReportOption);
    } else {
      this.buildNonOSXMenu(app, aboutOption, bugReportOption);
    }
  }

  buildOSXMenu(app, name, aboutOption, bugReportOption) {
    const self = this;
    this.template.push({
      label: name,
      submenu: [
        aboutOption,
        {
          label: 'Preferences...',
          accelerator: 'Command+,',
          click() { self.emit('preferences'); }
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click() { app.quit(); }
        }
      ]
    });
    this.template.push({
      label: 'Help',
      role: 'help',
      submenu: [
        bugReportOption
      ]
    });
  }

  buildNonOSXMenu(app, aboutOption, bugReportOption) {
    const self = this;
    this.template.push({
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'Ctrl+Q',
          click() { app.quit(); }
        }
      ]
    });
    this.template.push({
      label: 'Edit',
      submenu: [
        {
          label: 'Preferences',
          click() { self.emit('preferences'); }
        }
      ]
    });
    this.template.push({
      label: 'Help',
      submenu: [
        aboutOption,
        bugReportOption
      ]
    });
  }
};
