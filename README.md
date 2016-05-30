# ![logo](https://raw.githubusercontent.com/cheshire137/huxleyfm/master/images/icon48.png) HuxleyFM

A desktop player for [SomaFM](http://somafm.com/). Compare to my [Chrome extension](https://github.com/cheshire137/soma-chrome) for listening to SomaFM.

## How to Develop

    npm install

This will install necessary packages as well as create config.json for you to modify.

If you want to be able to scrobble songs to your Last.fm account, you will need to configure config.json with [your Last.fm API key and secret](http://www.last.fm/api/account/create).

Specify `user_agent` in config.json to something custom for your app. The user agent is sent in request headers to Last.fm and the Soma API.

    npm start

### Environment Variables

Pass `NODE_ENV=development` to view the JavaScript console for debugging, e.g., `NODE_ENV=development npm start`.

Pass `ENABLE_CHROMECAST=1` to enable the Chromecast button when a station is played.

Pass `DISABLE_PLAYING=1` to disable actually playing music when a station is selected.

### Troubleshooting

If you run into an error about a module version mismatch, try running `npm version`. My output looks like:

```
% npm version
{ huxleyfm: '0.0.1',
  npm: '3.9.3',
  ares: '1.10.1-DEV',
  http_parser: '2.7.0',
  icu: '57.1',
  modules: '48',
  node: '6.2.0',
  openssl: '1.0.2h',
  uv: '1.9.1',
  v8: '5.0.71.47',
  zlib: '1.2.8' }
```

If your `modules` is not 48, upgrade node. In OS X if you installed via Homebrew:

    brew update
    brew upgrade node
    npm install -g npm

After upgrading node:

    npm install -g node-gyp
    cd node_modules/mdns
    node-gyp BUILDTYPE=Release rebuild

If you hit errors installing `castv2-client`, try running `npm install castv2-client --no-optional`.

### How to Build

    npm run build

Builds the app for OS X using [electron-packager](https://github.com/electron-userland/electron-packager).

    npm run-script build-windows

Builds the app for Windows.

## License

MIT © [Sarah Vessels](http://3till7.net)
