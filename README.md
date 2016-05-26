# soma-electron

A desktop player for [SomaFM](http://somafm.com/). Compare to the [Chrome extension](https://github.com/cheshire137/soma-chrome).

## How to Develop

    cp config.json.example config.json

Configure config.json with [your Last.fm API key and secret](http://www.last.fm/api/account/create). Also specify `user_agent` to something custom for your app. The user agent is sent in request headers to Last.fm and the Soma API.

    npm install
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
