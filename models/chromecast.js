const Client = require('castv2-client').Client;
const DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
const mdns = require('mdns');

module.exports = class Chromecast {
  constructor(opts) {
    this.options = {
      host: opts.host,
      url: opts.url
    };
    this.client = new Client();
    this.client.connect(this.options.host, this.onConnect.bind(this));
    this.client.on('error', this.onClientError.bind(this));
  }

  onConnect() {
    console.log('connected to Chromecast');
    this.client.launch(DefaultMediaReceiver, this.onLaunch.bind(this));
  }

  onLaunch(err, player) {
    if (err) {
      console.error('Chromecast launch error', err);
    } else {
      console.log('launched', player);
    }
    const media = {
      contentId: this.options.url,
      contentType: 'audio/mpeg',
      streamType: 'LIVE'
    };
    console.log('media', media);
    player.on('status', this.onStatus.bind(this));
    player.load(media, { autoplay: true }, this.onPlayerLoad.bind(this));
  }

  onStatus(status) {
    console.log('status', status);
  }

  onPlayerLoad(err, status) {
    if (err) {
      console.error('Chromecast player load error', err);
    } else {
      console.log('player loaded', status);
    }
  }

  onClientError(err) {
    console.error('Chromecast client error', err);
    this.client.close();
  }
}
