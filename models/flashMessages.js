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

  flashMessage(message, isError) {
    this.statusArea.textContent = message;
    if (isError) {
      this.statusArea.classList.add('error');
    } else {
      this.statusArea.classList.remove('error');
    }
    this.statusArea.classList.remove('hidden');
    window.scrollTo(0, 0);
    const delay = isError ? 10000 : 2000;
    setTimeout(() => {
      this.statusArea.classList.add('hidden');
      this.statusArea.textContent = '';
    }, delay);
  }
}
