import createElementFromString from '../../lib/create-element.js';

export default class NotificationMessage {
  static activeNotification;

  constructor(message, {
    duration = 250,
    type = 'success'
  } = {}) {
    this.message = message;
    this.messageType = type;
    this.duration = duration;

    this.#render();
  }

  get durationInSeconds() {
    return this.duration / 1000;
  }

  get #template() {
    return `
      <div class="notification ${this.messageType}" style="--value: ${this.durationInSeconds}s">
        <div class="timer"></div>
        <div class="inner-wrapper">
          <div class="notification-header">${this.messageType}</div>
          <div class="notification-body">
            ${this.message}
          </div>
        </div>
      </div>
    `;
  }

  #render() {
    if (NotificationMessage.activeNotification) {
      NotificationMessage.activeNotification.destroy();
    }

    this.element = createElementFromString(this.#template);

    NotificationMessage.activeNotification = this;
  }

  show(container = document.body) {
    container.append(this.element);

    setTimeout(() => {
      this.remove();
    }, this.duration);
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
    NotificationMessage.activeNotification = null;
  }
}
