const {remote} = require('electron');
const {Menu, MenuItem} = remote;

module.exports = class AppMenu {
  constructor() {
    this.template = [];
    this.buildMenu();
    Menu.setApplicationMenu(Menu.buildFromTemplate(this.template));
  }

  buildMenu() {
    if (process.platform === 'darwin') {
      const app = require('electron').remote.app;
      const name = app.getName();
      this.template.unshift({
        label: name,
        submenu: [
          {
            label: 'About ' + name,
            role: 'about'
          },
          {
            label: 'Quit',
            accelerator: 'Command+Q',
            click() { app.quit(); }
          },
        ]
      });
    }
  }
}
