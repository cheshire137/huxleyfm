// Thanks to http://www.datchley.name/es6-eventemitter/
module.exports = class Eventful {
  constructor() {
    this.listeners = new Map();
  }

  emit(label, ...args) {
    let listeners = this.listeners.get(label);
    if (listeners && listeners.length) {
      listeners.forEach((listener) => {
        listener(...args);
      });
      return true;
    }
    return false;
  }

  addListener(label, callback) {
    if (!this.listeners.has(label)) {
      this.listeners.set(label, []);
    }
    this.listeners.get(label).push(callback);
  }

  removeListener(label, callback) {
    let listeners = this.listeners.get(label);
    let index;
    if (listeners && listeners.length) {
      index = listeners.reduce((i, listener, index) => {
        return (isFunction(listener) && listener === callback) ?
          i = index :
          i;
      }, -1);
      if (index > -1) {
        listeners.splice(index, 1);
        this.listeners.set(label, listeners);
        return true;
      }
    }
    return false;
  }
}
