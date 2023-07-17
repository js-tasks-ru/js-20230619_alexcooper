import { BaseComponent } from "../../lib/components.js";

const TOOLTIP_POSITION_OFFSET = 10;

export default class Tooltip extends BaseComponent {
  static #instance;

  element;

  #onDocumentPointerOver = (event) => {
    const tooltipText = event.target.dataset.tooltip;

    if (tooltipText) {
      this.render(tooltipText);
    }
  }

  #onDocumentPointerOut = () => {
    this.remove();
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
    super();

    if (Tooltip.#instance) {
      return Tooltip.#instance;
    }

    Tooltip.#instance = this;
  }

  addEventListeners() {
    document.addEventListener('pointerover', this.#onDocumentPointerOver);
    document.addEventListener('pointerout', this.#onDocumentPointerOut);
    document.addEventListener('pointermove', this.#onDocumentPointerMove);
  }

  removeEventListeners() {
    document.removeEventListener('pointerover', this.#onDocumentPointerOver);
    document.removeEventListener('pointerout', this.#onDocumentPointerOut);
    document.removeEventListener('pointermove', this.#onDocumentPointerMove);
  }

  getTemplate(text) {
    return `<div class="tooltip">${text}</div>`;
  }

  render(text) {
    if (!text) {
      return;
    }

    super.render(text);

    document.body.append(this.element);
  }
}
