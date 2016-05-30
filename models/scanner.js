const mdns = require('multicast-dns');
const Eventful = require('./eventful');

const __bind = function(fn, me) {
  return function() {
    return fn.apply(me, arguments);
  };
};

module.exports = class Scanner extends Eventful {
  constructor(opts) {
    super();
    this.options = {
      ttl: 10000,
      serviceName: '_googlecast._tcp.local',
      serviceType: 'PTR',
      mdns: {}
    };
    if (opts) {
      this.options.name = opts.name;
    }
    this.chromecastIPs = [];
    this.onResponse = __bind(this.onResponse, this);
  }

  findChromecasts() {
    this.m = mdns(this.options.mdns);
    this.timer = setTimeout(() => {
      if (this.chromecastIPs.length < 1) {
        this.emit('error', 'no Chromecasts were found');
      } else {
        this.emit('finished', 'stopped searching for Chromecasts');
      }
      this.close();
    }, this.options.ttl);
    this.m.on('response', this.onResponse);
    this.m.query({
      questions: [{
        name: this.options.serviceName,
        type: this.options.serviceType
      }]
    });
  }

  onResponse(response) {
    const answer = response.answers.filter((a) => {
      return a.name === this.options.serviceName &&
             a.type === this.options.serviceType;
    })[0];
    if (!answer) {
      return;
    }
    const info = response.additionals.filter(entry => entry.type === 'A')[0];
    if (!info || (this.options.name && this.options.name !== info.name)) {
      return;
    }
    if (this.chromecastIPs.indexOf(info.data) < 0) {
      this.chromecastIPs.push(info.data);
      this.emit('chromecast', info);
    }
  }

  close() {
    this.m.removeListener('response', this.onResponse);
    clearTimeout(this.timer);
    this.m.destroy();
  }
}
