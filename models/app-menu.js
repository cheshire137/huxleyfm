const { remote } = require('electron');
const { Menu, MenuItem } = remote;
const Eventful = require('./eventful');

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
    if (process.platform === 'darwin') {
      this.template.unshift({
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
          },
        ]
      });
    } else {
      this.template.unshift({
        label: 'Options',
        submenu: [
          {
            label: 'Options',
            click() { self.emit('preferences'); }
          }
        ]
      });
      this.template.unshift({
        label: 'Help',
        submenu: [
          aboutOption
        ]
      });
    }
  }
};
