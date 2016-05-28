'use strict';
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// prevent window being garbage collected
let mainWindow;

function onClosed() {
	// dereference the window
	// for multiple windows store them in an array
	mainWindow = null;
}

function createMainWindow() {
	let win;
	const windowProperties = {
		icon: 'images/icon128.png',
		title: 'HuxleyFM',
		resizable: false
	};
	if (process.env.NODE_ENV === 'development') {
		windowProperties.width = 800;
		windowProperties.height = 600;
		win = new BrowserWindow(windowProperties);
		win.webContents.openDevTools()
	} else {
		windowProperties.width = 400;
		windowProperties.height = 375;
		win = new BrowserWindow(windowProperties);
	}
	win.loadURL(`file://${__dirname}/page/page.html`);
	win.on('closed', onClosed);
	return win;
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

app.on('ready', () => {
	mainWindow = createMainWindow();
});
