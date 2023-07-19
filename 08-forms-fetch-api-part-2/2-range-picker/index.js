import { BaseComponent } from "../../lib/components.js";

export default class RangePicker extends BaseComponent {
  selected = {
    from: new Date(),
    to: new Date(),
  }

  selectedDateFrom;
  isSelectingFrom = true;
  isOpen = false;

  static elementOpenedClassName = 'rangepicker_open';
  static cellElementClassName = 'rangepicker__cell';
  static cellFromClassName = 'rangepicker__selected-from';
  static cellBetweenClassName = 'rangepicker__selected-between';
  static cellToClassName = 'rangepicker__selected-to';

  #onDocumentClick = (event) => {
    const isRangePicker = this.element.contains(event.target);

    if (this.isOpen && !isRangePicker) {
      this.#close();
    }
  }

  #onInputClick = () => {
    if (!this.isOpen) {
      this.#open();
      this.#renderRangePicker();
    } else {
      this.#close();
    }
  }

  #onNextIntervalButtonClick = () => {
    this.#goToNextMonth();
  }

  #onPrevIntervalButtonClick = () => {
    this.#goToPrevMonth();
  }

  #onCellClick = (event) => {
    const isCell = event.target.classList.contains(RangePicker.cellElementClassName);

    if (!isCell) {
      return;
    }

    const isSelectingFrom = this.isSelectingFrom;
    const isSelectingTo = !isSelectingFrom;
    const cellElement = event.target;
    const cellDate = new Date(cellElement.dataset.value);
    const { from: dateSelectedFrom } = this.selected;

    if (isSelectingFrom) {
      this.#setSelected(cellDate, null);

      this.isSelectingFrom = false;
      this.#highlightSelectedCells();
    }

    if (isSelectingTo) {
      if (cellDate > dateSelectedFrom) {
        this.#setSelected(dateSelectedFrom, cellDate);
      } else {
        this.#setSelected(cellDate, dateSelectedFrom);
      }

      this.isSelectingFrom = true;
      this.#highlightSelectedCells();
    }

    if (this.selected.from && this.selected.to) {
      this.#close();
      this.#updateSelectedText();
      this.#dispatchEvent();
    }
  }

  constructor({
    from = new Date(),
    to = new Date(),
  } = {}) {
    super();

    this.selected = { from, to };
    this.selectedDateFrom = new Date(from);

    this.initialize();
  }

  initialize() {
    super.initialize();

    this.#updateSelectedText();
  }

  getTemplate() {
    return `
      <div class="rangepicker">
        <div class="rangepicker__input" data-element="input">
          <span data-element="from"></span> -
          <span data-element="to"></span>
        </div>
        <div class="rangepicker__selector" data-element="selector"></div>
      </div>
    `;
  }

  #getSelectorTemplate(dateFrom, dateTo) {
    return `
      <div class="rangepicker__selector-arrow"></div>
      <div class="rangepicker__selector-control-left" data-element="prevInterval"></div>
      <div class="rangepicker__selector-control-right" data-element="nextInterval"></div>
      ${ this.#getCalendarTemplate(dateFrom) }
      ${ this.#getCalendarTemplate(dateTo) }
    `;
  }

  /**
   *
   * @param {Date} date
   * @returns {string}
   */
  #getCalendarTemplate(date) {
    const monthName = date.toLocaleString('ru', { month: 'long' });

    return `
      <div class="rangepicker__calendar">
        <div class="rangepicker__month-indicator">
          <time datetime="${monthName}">${monthName}</time>
        </div>
        <div class="rangepicker__day-of-week">
          <div>Пн</div>
          <div>Вт</div>
          <div>Ср</div>
          <div>Чт</div>
          <div>Пт</div>
          <div>Сб</div>
          <div>Вс</div>
        </div>
        <div class="rangepicker__date-grid">
            ${ this.#getCalendarGridTemplate(date) }
        </div>
      </div>
    `;
  }

  #getCalendarGridTemplate(date) {
    date.setDate(1);

    const firstDayIndex = date.getDay();
    const gridStartIndex = firstDayIndex === 0
      ? 7
      : firstDayIndex;

    const currentMonth = date.getMonth();
    const wrapperElement = document.createElement('div');

    while (date.getMonth() === currentMonth) {
      const nextDay = date.getDate() + 1;

      const cellHTML = this.#getCalendarGridCellTemplate(date);
      const cellElement = RangePicker.createElement(cellHTML);

      wrapperElement.append(cellElement);

      date.setDate(nextDay);
    }

    wrapperElement.firstElementChild.style = `--start-from: ${gridStartIndex}`;

    return wrapperElement.innerHTML;
  }

  #getCalendarGridCellTemplate(date) {
    const day = date.getDate();
    const dateValue = date.toISOString();

    return `<button type="button" class="rangepicker__cell" data-value="${dateValue}">${day}</button>`;
  }

  #highlightSelectedCells() {
    const { from: dateSelectedFrom, to: dateSelectedTo } = this.selected;

    const dateSelectedFromISOString = dateSelectedFrom
      ? dateSelectedFrom.toISOString()
      : null;

    const dateSelectedToISOString = dateSelectedTo
      ? dateSelectedTo.toISOString()
      : null;

    const cellElements = this.element
      .getElementsByClassName(RangePicker.cellElementClassName);

    for (const cellElement of cellElements) {
      const cellDateISOString = cellElement.dataset.value;
      const cellDate = new Date(cellDateISOString);

      this.#restCellElementHighlight(cellElement);

      if (cellDateISOString === dateSelectedFromISOString) {
        cellElement.classList.add(RangePicker.cellFromClassName);
      } else if (cellDateISOString === dateSelectedToISOString) {
        cellElement.classList.add(RangePicker.cellToClassName);
      } else if (cellDate >= dateSelectedFrom && cellDate <= dateSelectedTo) {
        cellElement.classList.add(RangePicker.cellBetweenClassName);
      }
    }
  }

  #restCellElementHighlight(cellElement) {
    cellElement.classList.remove(RangePicker.cellFromClassName);
    cellElement.classList.remove(RangePicker.cellBetweenClassName);
    cellElement.classList.remove(RangePicker.cellToClassName);
  }

  #renderRangePicker() {
    const { selector: selectorElement } = this.subElements;

    const dateFrom = new Date(this.selectedDateFrom);
    const dateTo = new Date(dateFrom);

    dateTo.setMonth(dateFrom.getMonth() + 1);

    selectorElement.innerHTML = this.#getSelectorTemplate(dateFrom, dateTo);

    this.#highlightSelectedCells();

    const {
      prevInterval: prevIntervalButtonElement,
      nextInterval: nextIntervalButtonElement,
    } = this.getSubElements(selectorElement);

    prevIntervalButtonElement.addEventListener('click', this.#onPrevIntervalButtonClick);
    nextIntervalButtonElement.addEventListener('click', this.#onNextIntervalButtonClick);
  }

  #goToPrevMonth() {
    const prevMonth = this.selectedDateFrom.getMonth() - 1;

    this.selectedDateFrom.setMonth(prevMonth);
    this.#renderRangePicker();
  }

  #goToNextMonth() {
    const nextMonth = this.selectedDateFrom.getMonth() + 1;

    this.selectedDateFrom.setMonth(nextMonth);
    this.#renderRangePicker();
  }

  /**
   *
   * @param {Date} date
   * @returns {string}
   */
  #formatDate(date) {
    return date.toLocaleString('ru', { dateStyle: 'short' });
  }

  #setSelected(from, to) {
    this.selected = { from, to };
  }

  #open() {
    this.isOpen = true;
    this.element.classList.add(RangePicker.elementOpenedClassName);
  }

  #close() {
    this.isOpen = false;
    this.element.classList.remove(RangePicker.elementOpenedClassName);
  }

  #updateSelectedText() {
    const { from: fromElement, to: toElement } = this.getSubElements();

    fromElement.textContent = this.#formatDate(this.selected.from);
    toElement.textContent = this.#formatDate(this.selected.to);
  }

  #dispatchEvent() {
    this.element.dispatchEvent(new CustomEvent('date-select', {
      bubbles: true,
      detail: this.selected,
    }));
  }

  addEventListeners() {
    const {
      input: datePickerInputElement,
      selector: datePickerSelectElement,
    } = this.subElements;

    datePickerInputElement.addEventListener('click', this.#onInputClick);
    datePickerSelectElement.addEventListener('click', this.#onCellClick);

    document.addEventListener('click', this.#onDocumentClick, true);
  }

  removeEventListeners() {
    const {
      input: datePickerInputElement,
      selector: datePickerSelectElement,
    } = this.subElements;

    datePickerInputElement.removeEventListener('click', this.#onInputClick);
    datePickerSelectElement.removeEventListener('click', this.#onCellClick);

    document.removeEventListener('click', this.#onDocumentClick, true);
  }
}
