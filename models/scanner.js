const mdns = require('multicast-dns');

const __bind = function(fn, me) {
  return function() {
    return fn.apply(me, arguments);
  };
};

module.exports = class Scanner {
  constructor(opts) {
    this.options = {
      ttl: 10000,
      serviceName: '_googlecast._tcp.local',
      serviceType: 'PTR',
      mdns: {}
    };
    if (opts) {
      this.options.name = opts.name;
    }
    this.chromecasts = [];
    this.resolve = null;
    this.reject = null;
    this.onResponse = __bind(this.onResponse, this);
  }

  findChromecasts() {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this.m = mdns(this.options.mdns);
      this.timer = setTimeout(() => {
        this.close();
        if (this.chromecasts.length > 0) {
          this.resolve(this.chromecasts);
        } else {
          this.reject('could not find any Chromecasts');
        }
      }, this.options.ttl);
      this.m.on('response', this.onResponse);
      this.startTime = new Date();
      this.m.query({
        questions: [{
          name: this.options.serviceName,
          type: this.options.serviceType
        }]
      });
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
    this.chromecasts.push(info);
  }

  close() {
    this.m.removeListener('response', this.onResponse);
    clearTimeout(this.timer);
    this.m.destroy();
  }
}
