import { BaseComponent } from "../../lib/components.js";

export default class NotificationMessage extends BaseComponent {
  static activeNotification;

  constructor(message, {
    duration = 250,
    type = 'success'
  } = {}) {
    super();

    this.message = message;
    this.messageType = type;
    this.duration = duration;

    this.initialize();
  }

  get durationInSeconds() {
    return this.duration / 1000;
  }

  getTemplate() {
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

  initialize() {
    if (NotificationMessage.activeNotification) {
      NotificationMessage.activeNotification.destroy();
    }

    NotificationMessage.activeNotification = this;

    super.initialize();
  }

  show(container = document.body) {
    container.append(this.element);

    setTimeout(() => {
      this.remove();
    }, this.duration);
  }

  destroy() {
    super.destroy();

    NotificationMessage.activeNotification = null;
  }
}
