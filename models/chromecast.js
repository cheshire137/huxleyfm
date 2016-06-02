const Client = require('castv2-client').Client;
const DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
const Eventful = require('./eventful');

module.exports = class Chromecast extends Eventful {
  constructor(opts) {
    super();
    this.url = opts.url;
    this.host = opts.host;
    this.imageUrl = opts.imageUrl;
    this.title = opts.title;
    this.client = new Client();
  }

  connect() {
    this.client.connect(this.host, this.onConnect.bind(this));
    this.client.on('error', this.onClientError.bind(this));
    this.client.on('close', this.onClientClose.bind(this));
  }

  close() {
    this.client.close();
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
      this.emit('launched', this.player);
    }
    this.player.on('status', this.onStatus.bind(this));
    this.load(this.getMedia());
  }

  getMedia() {
    const media = {
      contentId: this.url,
      contentType: 'audio/mpeg',
      streamType: 'LIVE'
    };
    if (this.title && this.imageUrl) {
      media.metadata = {
        type: 0,
        metadataType: 0,
        title: this.title,
        images: [{ url: this.imageUrl }]
      };
    }
    return media;
  }

  load(media) {
    this.player.load(media, { autoplay: true }, this.onPlayerLoad.bind(this));
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

  onClientClose() {
    console.debug('Chromecast closed');
    this.emit('close');
  }
};
