class BaseComponent {
  element;
  subElements = {};

  data;

  static backendURL = 'https://course-js.javascript.ru';

  static createElement(html) {
    const element = document.createElement('div');
    element.innerHTML = html;

    return element.firstElementChild;
  }

  initialize() {
    this.render();
    this.subElements = this.getSubElements();

    this.addEventListeners();
  }

  render(...args) {
    const template = this.getTemplate(...args);

    this.element = BaseComponent.createElement(template);
  }

  getSubElements() {
    if (!this.element) {
      this.subElements = {};

      return;
    }

    const elements = this.element.querySelectorAll('[data-element]');
    const items = Array.from(elements);

    return items.reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  getTemplate() {
    throw new Error('Not implemented');
  }

  update() {
    throw new Error('Not implemented');
  }

  addEventListeners() {}

  removeEventListeners() {}

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.removeEventListeners();

    this.element = null;
    this.data = null;
  }
}

export { BaseComponent };
