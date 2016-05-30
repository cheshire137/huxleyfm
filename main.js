'use strict';
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const globalShortcut = electron.globalShortcut;

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
		windowProperties.width = 900;
		windowProperties.height = 370;
		win = new BrowserWindow(windowProperties);
		win.webContents.openDevTools();
	} else {
		windowProperties.width = 400;
		windowProperties.height = 370;
		win = new BrowserWindow(windowProperties);
	}
	win.loadURL(`file://${__dirname}/page/page.html`);
	win.on('closed', onClosed);
	return win;
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		globalShortcut.unregisterAll();
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
	['MediaPlayPause', 'MediaStop'].forEach(registerMediaKey);
});

app.on('before-quit', () => {
	mainWindow.webContents.send('quit');
});

function registerMediaKey(key) {
	const success = globalShortcut.register(key, () => {
		mainWindow.webContents.send('media-key', key);
	});
	if (!success) {
		process.stderr.write('failed to bind key ' + key + '\n');
	}
}
