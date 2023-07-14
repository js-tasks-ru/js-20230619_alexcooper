const TOOLTIP_POSITION_OFFSET = 10;

export default class Tooltip {
  static #instance;

  element;

  #onDocumentPointerOver = (event) => {
    const tooltipText = event.target.dataset.tooltip;

    if (tooltipText) {
      this.render(tooltipText);
    }
  }

  #onDocumentPointerOut = () => {
    this.#remove();
  }

  #onDocumentPointerMove = (event) => {
    if (!this.element) {
      return;
    }

    const x = event.clientX + TOOLTIP_POSITION_OFFSET;
    const y = event.clientY + TOOLTIP_POSITION_OFFSET;

    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
  }

  constructor() {
    if (Tooltip.#instance) {
      return Tooltip.#instance;
    }

    Tooltip.#instance = this;
  }

  #addEventListeners() {
    document.addEventListener('pointerover', this.#onDocumentPointerOver);
    document.addEventListener('pointerout', this.#onDocumentPointerOut);
    document.addEventListener('pointermove', this.#onDocumentPointerMove);
  }

  #removeEventListeners() {
    document.removeEventListener('pointerover', this.#onDocumentPointerOver);
    document.removeEventListener('pointerout', this.#onDocumentPointerOut);
    document.removeEventListener('pointermove', this.#onDocumentPointerMove);
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
