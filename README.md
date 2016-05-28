# ![logo](https://raw.githubusercontent.com/cheshire137/huxleyfm/master/images/icon48.png) HuxleyFM

A desktop player for [SomaFM](http://somafm.com/). Compare to my [Chrome extension](https://github.com/cheshire137/soma-chrome) for listening to SomaFM.

## How to Develop

    npm install

This will install necessary packages as well as create config.json for you to modify.

If you want to be able to scrobble songs to your Last.fm account, you will need to configure config.json with [your Last.fm API key and secret](http://www.last.fm/api/account/create).

Specify `user_agent` in config.json to something custom for your app. The user agent is sent in request headers to Last.fm and the Soma API.

    npm start

To view the JavaScript console for debugging, run:

    NODE_ENV=development npm start

### How to Build

    npm run build

Builds the app for OS X using [electron-packager](https://github.com/electron-userland/electron-packager).

    npm run-script build-windows

Builds the app for Windows.

## License

MIT © [Sarah Vessels](http://3till7.net)
