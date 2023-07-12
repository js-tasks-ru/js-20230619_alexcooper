import createElementFromString from '../../lib/create-element.js';

const SLIDER_IS_DRAGGING_CLASS_NAME = 'range-slider_dragging';

export default class DoubleSlider {
  element;
  #subElements = {};

  #draggingElement;
  #shiftX;

  get range() {
    const {
      thumbLeft: thumbLeftElement,
      thumbRight: thumbRightElement,
    } = this.#subElements;

    const rangeInterval = this.max - this.min;

    const leftPercent = parseFloat(thumbLeftElement.style.left);
    const rightPercent = parseFloat(thumbRightElement.style.right);

    const from = this.min + Math.round(leftPercent / 100 * rangeInterval);
    const to = this.max - Math.round(rightPercent / 100 * rangeInterval);

    return { from, to };
  }

  #onPointerDown = (event) => {
    const element = event.target;

    const { thumbLeft: thumbLeftElement } = this.#subElements;
    const isLeftThumb = element === thumbLeftElement;

    const { left, right } = element.getBoundingClientRect();

    if (isLeftThumb) {
      this.#shiftX = event.clientX - left;
    } else {
      this.#shiftX = event.clientX - right;
    }

    element.classList.add(SLIDER_IS_DRAGGING_CLASS_NAME);

    this.#draggingElement = element;

    document.addEventListener('pointermove', this.#onPointerMove);
    document.addEventListener('pointerup', this.#onPointerUp);
  }

  #onPointerMove = (event) => {
    const {
      inner: innerElement,
      thumbLeft: thumbLeftElement,
      thumbRight: thumbRightElement,
      from: fromElement,
      to: toElement,
      progress: progressElement,
    } = this.#subElements;

    const {
      left: innerLeft,
      right: innerRight,
      width: innerWidth
    } = innerElement.getBoundingClientRect();

    const isLeftThumb = this.#draggingElement === thumbLeftElement;
    const isRightThumb = this.#draggingElement === thumbRightElement;

    if (isLeftThumb) {
      let leftPercent = (event.clientX - innerLeft + this.#shiftX) / innerWidth * 100;

      if (leftPercent < 0) {
        leftPercent = 0;
      }

      const rightPercent = parseFloat(thumbRightElement.style.right);
      if (leftPercent + rightPercent > 100) {
        leftPercent = 100 - rightPercent;
      }

      thumbLeftElement.style.left = `${leftPercent}%`;
      progressElement.style.left = `${leftPercent}%`;
      fromElement.textContent = this.formatValue(this.range.from);
    }

    if (isRightThumb) {
      let rightPercent = (innerRight - event.clientX + this.#shiftX) / innerWidth * 100;

      if (rightPercent < 0) {
        rightPercent = 0;
      }

      const leftPercent = parseFloat(thumbLeftElement.style.left);
      if (leftPercent + rightPercent > 100) {
        rightPercent = 100 - leftPercent;
      }

      thumbRightElement.style.right = `${rightPercent}%`;
      progressElement.style.right = `${rightPercent}%`;
      toElement.textContent = this.formatValue(this.range.to);
    }
  }

  #onPointerUp = () => {
    const thumbElement = this.#draggingElement;

    thumbElement.classList.remove(SLIDER_IS_DRAGGING_CLASS_NAME);

    document.removeEventListener('pointermove', this.#onPointerMove);
    document.removeEventListener('pointerup', this.#onPointerUp);

    this.element.dispatchEvent(new CustomEvent('range-select', {
      detail: this.range,
      bubbles: true
    }));
  }

  constructor({
    min = 0,
    max = 200,
    formatValue = value => `$${value}`,
    selected = {
      from: min,
      to: max
    }
  } = {}) {
    this.min = min;
    this.max = max;
    this.formatValue = formatValue;
    this.selected = selected;

    this.#render();
  }

  get #template() {
    const { from, to } = this.selected;
    const fromText = this.formatValue(from);
    const toText = this.formatValue(to);

    return `
      <div class="range-slider">
        <span data-element="from">${fromText}</span>
        <div data-element="inner" class="range-slider__inner">
          <span data-element="progress" class="range-slider__progress"></span>
          <span data-element="thumbLeft" class="range-slider__thumb-left"></span>
          <span data-element="thumbRight" class="range-slider__thumb-right"></span>
        </div>
        <span data-element="to">${toText}</span>
      </div>
    `;
  }

  #render() {
    this.element = createElementFromString(this.#template);
    this.#subElements = this.#getSubElements();

    this.element.ondragstart = () => false;

    this.#addEventListeners();

    this.#initialize();
  }

  #initialize() {
    const {
      progress: progressElement,
      thumbLeft: thumbLeftElement,
      thumbRight: thumbRightElement,
    } = this.#subElements;

    const rangeInterval = this.max - this.min;

    const left = Math.floor((this.selected.from - this.min) / rangeInterval * 100) + '%';
    const right = Math.floor((this.max - this.selected.to) / rangeInterval * 100) + '%';

    progressElement.style.left = left;
    progressElement.style.right = right;

    thumbLeftElement.style.left = left;
    thumbRightElement.style.right = right;
  }

  #getSubElements() {
    const elements = this.element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  #addEventListeners() {
    const { thumbLeft: thumbLeftElement, thumbRight: thumbRightElement } = this.#subElements;

    thumbLeftElement.addEventListener('pointerdown', this.#onPointerDown);
    thumbRightElement.addEventListener('pointerdown', this.#onPointerDown);
  }

  #removeEventListeners() {
    const { thumbLeft: thumbLeftElement, thumbRight: thumbRightElement } = this.#subElements;

    thumbLeftElement.removeEventListener('pointerdown', this.#onPointerDown);
    thumbRightElement.removeEventListener('pointerdown', this.#onPointerDown);

    document.removeEventListener('pointermove', this.#onPointerMove);
    document.removeEventListener('pointerup', this.#onPointerUp);
  }

  #remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.#removeEventListeners();
    this.#remove();

    this.element = null;
    this.subElements = {};
  }
}
