import createElementFromString from '../../lib/create-element.js';

const SLIDER_IS_DRAGGING_CLASS_NAME = 'range-slider_dragging';

export default class DoubleSlider {
  element;
  #subElements = {};

  #draggingElement;
  #shiftX;

  static ThumbType = {
    Left: Symbol('left'),
    Right: Symbol('right'),
  }

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

  #onThumbPointerDown = (event) => {
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

    document.addEventListener('pointermove', this.#onDocumentPointerMove);
    document.addEventListener('pointerup', this.#onDocumentPointerUp);
  }

  #onDocumentPointerMove = (event) => {
    const {
      inner: innerElement,
      thumbLeft: thumbLeftElement,
      thumbRight: thumbRightElement,
    } = this.#subElements;

    const {
      left: innerLeft,
      right: innerRight,
      width: innerWidth
    } = innerElement.getBoundingClientRect();

    const thumbType = this.#draggingElement === thumbLeftElement
      ? DoubleSlider.ThumbType.Left
      : DoubleSlider.ThumbType.Right;

    const anotherThumbPositionOffset = thumbType === DoubleSlider.ThumbType.Left
      ? parseFloat(thumbRightElement.style.right)
      : parseFloat(thumbLeftElement.style.left);

    let positionOffset = thumbType === DoubleSlider.ThumbType.Left
      ? (event.clientX - innerLeft + this.#shiftX) / innerWidth * 100
      : (innerRight - event.clientX + this.#shiftX) / innerWidth * 100;

    positionOffset = Math.max(0, positionOffset);

    if (positionOffset + anotherThumbPositionOffset > 100) {
      positionOffset = 100 - anotherThumbPositionOffset;
    }

    this.#updateThumbPositionOffset(positionOffset, thumbType);
  }

  #onDocumentPointerUp = () => {
    const thumbElement = this.#draggingElement;

    thumbElement.classList.remove(SLIDER_IS_DRAGGING_CLASS_NAME);

    document.removeEventListener('pointermove', this.#onDocumentPointerMove);
    document.removeEventListener('pointerup', this.#onDocumentPointerUp);

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

    this.#initialize();
  }

  get #template() {
    return `
      <div class="range-slider">
        <span data-element="from"></span>
        <div data-element="inner" class="range-slider__inner">
          <span data-element="progress" class="range-slider__progress"></span>
          <span data-element="thumbLeft" class="range-slider__thumb-left"></span>
          <span data-element="thumbRight" class="range-slider__thumb-right"></span>
        </div>
        <span data-element="to"></span>
      </div>
    `;
  }

  #render() {
    this.element = createElementFromString(this.#template);
    this.#subElements = this.#getSubElements();
  }

  #initialize() {
    this.#render();

    this.#addEventListeners();

    this.element.ondragstart = () => false;

    const {
      progress: progressElement,
      thumbLeft: thumbLeftElement,
      thumbRight: thumbRightElement,
      from: fromElement,
      to: toElement,
    } = this.#subElements;

    const rangeInterval = this.max - this.min;

    const leftPercent = Math.floor((this.selected.from - this.min) / rangeInterval * 100) + '%';
    const rightPercent = Math.floor((this.max - this.selected.to) / rangeInterval * 100) + '%';

    progressElement.style.left = leftPercent;
    progressElement.style.right = rightPercent;

    thumbLeftElement.style.left = leftPercent;
    thumbRightElement.style.right = rightPercent;


    const { from, to } = this.selected;

    fromElement.textContent = this.formatValue(from);
    toElement.textContent = this.formatValue(to);
  }

  #getSubElements() {
    const elements = this.element.querySelectorAll('[data-element]');
    const items = Array.from(elements);

    return items.reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  #updateThumbPositionOffset(positionOffset, thumbType) {
    const {
      from: fromElement,
      to: toElement,
      progress: progressElement,
      thumbLeft: thumbLeftElement,
      thumbRight: thumbRightElement,
    } = this.#subElements;

    if (thumbType === DoubleSlider.ThumbType.Left) {
      thumbLeftElement.style.left = `${positionOffset}%`;
      progressElement.style.left = `${positionOffset}%`;
      fromElement.textContent = this.formatValue(this.range.from);
    }

    if (thumbType === DoubleSlider.ThumbType.Right) {
      thumbRightElement.style.right = `${positionOffset}%`;
      progressElement.style.right = `${positionOffset}%`;
      toElement.textContent = this.formatValue(this.range.to);
    }
  }

  #addEventListeners() {
    const { thumbLeft: thumbLeftElement, thumbRight: thumbRightElement } = this.#subElements;

    thumbLeftElement.addEventListener('pointerdown', this.#onThumbPointerDown);
    thumbRightElement.addEventListener('pointerdown', this.#onThumbPointerDown);
  }

  #removeEventListeners() {
    const { thumbLeft: thumbLeftElement, thumbRight: thumbRightElement } = this.#subElements;

    thumbLeftElement.removeEventListener('pointerdown', this.#onThumbPointerDown);
    thumbRightElement.removeEventListener('pointerdown', this.#onThumbPointerDown);

    document.removeEventListener('pointermove', this.#onDocumentPointerMove);
    document.removeEventListener('pointerup', this.#onDocumentPointerUp);
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
  }
}
