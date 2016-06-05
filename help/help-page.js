const Eventful = require('../models/eventful');
const shell = require('electron').shell;
const Config = require('../config.json');

const __bind = function(fn, me) {
  return function() {
    return fn.apply(me, arguments);
  };
};

class HelpPage extends Eventful {
  constructor() {
    console.debug('help page init');
    super();
    this.reportBug = __bind(this.reportBug, this);
    this.findElements();
    this.listenForBugReports();
  }

  findElements() {
    this.bugReportLink = document.getElementById('bug-report-link');
  }

  listenForBugReports() {
    this.bugReportLink.addEventListener('click', this.reportBug);
  }

  reportBug(event) {
    event.preventDefault();
    event.target.blur();
    shell.openExternal(Config.new_bug_report_url);
  }

  removeListeners() {
    console.debug('unbinding help page listeners');
    this.bugReportLink.removeEventListener('click', this.reportBug);
  }
}

module.exports = HelpPage;
