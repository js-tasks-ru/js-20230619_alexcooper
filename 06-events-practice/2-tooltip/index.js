const TOOLTIP_POSITION_OFFSET = 10;

export default class Tooltip {
  static instance;

  element;

  #onPointerOver = (event) => {
    const element = event.target.closest('[data-tooltip]');

    if (element) {
      const text = element.dataset.tooltip;

      this.render(text);
    }
  }

  #onPointerOut = () => {
    this.#remove();
  }

  #onPointerMove = (event) => {
    if (!this.element) {
      return;
    }

    const x = event.clientX + TOOLTIP_POSITION_OFFSET;
    const y = event.clientY + TOOLTIP_POSITION_OFFSET;

    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
  }

  constructor() {
    if (Tooltip.instance) {
      return Tooltip.instance;
    }

    Tooltip.instance = this;
  }

  #addEventListeners() {
    document.addEventListener('pointerover', this.#onPointerOver);
    document.addEventListener('pointerout', this.#onPointerOut);
    document.addEventListener('pointermove', this.#onPointerMove);
  }

  #removeEventListeners() {
    document.removeEventListener('pointerover', this.#onPointerOver);
    document.removeEventListener('pointerout', this.#onPointerOut);
    document.removeEventListener('pointermove', this.#onPointerMove);
  }

  render(text) {
    this.element = document.createElement('div');

    this.element.classList.add('tooltip');
    this.element.textContent = text;

    document.body.append(this.element);
  }

  initialize () {
    this.#addEventListeners();
  }

  #remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.#removeEventListeners();
    this.#remove();
  }
}
