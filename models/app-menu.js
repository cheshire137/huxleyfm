const { remote, shell } = require('electron');
const { Menu } = remote;
const Eventful = require('./eventful');
const Config = require('../config.json');

module.exports = class AppMenu extends Eventful {
  constructor() {
    super();
    this.template = [];
    const self = this;
    this.aboutOption = {
      label: `About ${name}`,
      click() { self.emit('about-app'); }
    };
    this.bugReportOption = {
      label: 'Report a bug',
      click() { shell.openExternal(Config.new_bug_report_url); }
    };
    this.docsOption = {
      label: 'Documentation',
      click() { self.emit('documentation'); }
    };
    this.buildMenu();
    Menu.setApplicationMenu(Menu.buildFromTemplate(this.template));
  }

  buildMenu() {
    const app = require('electron').remote.app;
    const name = app.getName();
    if (process.platform === 'darwin') {
      this.buildOSXMenu(app, name);
    } else {
      this.buildNonOSXMenu(app);
    }
  }

  buildOSXMenu(app, name) {
    const self = this;
    this.template.push({
      label: name,
      submenu: [
        this.aboutOption,
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
        this.docsOption,
        this.bugReportOption
      ]
    });
  }

  buildNonOSXMenu(app) {
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
        this.docsOption,
        this.aboutOption,
        this.bugReportOption
      ]
    });
  }
};
