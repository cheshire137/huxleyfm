module.exports = class FlashMessages {
  constructor(element) {
    this.statusArea = element;
  }

  error(message) {
    this.flashMessage(message, true);
  }

  notice(message) {
    this.flashMessage(message, false);
  }

  dismissAlert() {
    this.statusArea.classList.add('hidden');
    while (this.statusArea.hasChildNodes()) {
      this.statusArea.removeChild(this.statusArea.lastChild);
    }
  }

  flashMessage(message, isError) {
    this.dismissAlert();
    this.statusArea.appendChild(this.getMessageSpan(message));
    this.statusArea.appendChild(this.getDismissLink());
    if (isError) {
      this.statusArea.classList.add('error');
    } else {
      this.statusArea.classList.remove('error');
    }
    this.statusArea.classList.remove('hidden');
    setTimeout(this.dismissAlert.bind(this), 10000);
  }

  getMessageSpan(message) {
    const messageSpan = document.createElement('span');
    messageSpan.appendChild(document.createTextNode(message));
    return messageSpan;
  }

  getDismissLink() {
    const link = document.createElement('a');
    link.className = 'dismiss-alert';
    link.href = '#';
    const icon = document.createElement('i');
    icon.className = 'material-icons';
    icon.textContent = 'close';
    link.appendChild(icon);
    link.addEventListener('click', (event) => {
      event.preventDefault();
      this.dismissAlert();
    }, false);
    return link;
  }
}
