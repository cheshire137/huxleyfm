const Eventful = require('./eventful');
const shell = require('electron').shell;

class LinkHandler extends Eventful {
  constructor() {
    super();
    const links = document.querySelectorAll('a[href]');
    for (let i = 0; i < links.length; i++) {
      this.handleLink(links[i]);
    }
  }

  handleLink(link) {
    const url = link.href;
    if (url.indexOf('http') === 0) {
      link.addEventListener('click', this.onExternalLinkClick.bind(this, url));
    } else {
      link.addEventListener('click', this.onInternalLinkClick.bind(this));
    }
  }

  onExternalLinkClick(url, e) {
    e.preventDefault();
    e.target.blur();
    shell.openExternal(url);
  }

  onInternalLinkClick(e) {
    e.preventDefault();
    let link = e.target;
    if (link.nodeName !== 'A') {
      link = link.closest('a');
    }
    const path = link.getAttribute('data-page-path');
    const pageID = link.getAttribute('data-page-id');
    if (path && pageID) {
      this.emit('page:load', path, pageID);
    }
  }
}

module.exports = LinkHandler;
