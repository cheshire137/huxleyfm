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

  onConnect() {
    this.emit('connected');
    this.client.launch(DefaultMediaReceiver, this.onLaunch.bind(this));
  }

  onLaunch(err, player) {
    if (err) {
      console.error('Chromecast launch error', err);
      this.emit('launch-error', err);
    } else {
      this.emit('launched');
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
      this.emit('player-load-error', err);
    } else {
      this.emit('player-loaded', status);
    }
  }

  onClientError(err) {
    console.error('Chromecast client error', err);
    this.emit('client-error', err);
    this.client.close();
  }
}
