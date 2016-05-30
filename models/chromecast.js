const Client = require('castv2-client').Client;
const DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
const mdns = require('mdns');
const Eventful = require('./eventful');

module.exports = class Chromecast extends Eventful {
  constructor(opts) {
    super();
    this.options = { host: opts.host, url: opts.url };
    this.client = new Client();
  }

  connect() {
    this.client.connect(this.options.host, this.onConnect.bind(this));
    this.client.on('error', this.onClientError.bind(this));
  }

  disconnect() {
    this.client.disconnect();
  }

  play() {
    if (!this.player) {
      return;
    }
    this.player.play(this.onPlay.bind(this));
  }

  pause() {
    if (!this.player) {
      return;
    }
    this.player.pause(this.onPause.bind(this));
  }

  stop() {
    if (!this.player) {
      return;
    }
    this.player.stop(this.onStop.bind(this));
  }

  onPlay(err, status) {
    if (err) {
      console.error('error playing Chromecast', err);
      this.emit('error', err);
    } else {
      this.emit('play', status);
    }
  }

  onPause(err, status) {
    if (err) {
      console.error('error pausing Chromecast', err);
      this.emit('error', err);
    } else {
      this.emit('pause', status);
    }
  }

  onStop(err, status) {
    if (err) {
      console.error('error stopping Chromecast', err);
      this.emit('error', err);
    } else {
      this.emit('stop', status);
    }
  }

  onConnect() {
    this.emit('connected');
    this.client.launch(DefaultMediaReceiver, this.onLaunch.bind(this));
  }

  onLaunch(err, player) {
    this.player = player;
    if (err) {
      console.error('Chromecast launch error', err);
      this.emit('error', err);
    } else {
      this.emit('launched', player);
    }
    const media = {
      contentId: this.options.url,
      contentType: 'audio/mpeg',
      streamType: 'LIVE'
    };
    player.on('status', this.onStatus.bind(this));
    player.load(media, { autoplay: true }, this.onPlayerLoad.bind(this));
  }

  onStatus(status) {
    this.emit('status', status);
  }

  onPlayerLoad(err, status) {
    if (err) {
      console.error('Chromecast player load error', err);
      this.emit('error', err);
    } else {
      this.emit('player-loaded', status);
    }
  }

  onClientError(err) {
    console.error('Chromecast client error', err);
    this.emit('error', err);
    this.client.close();
  }
}
