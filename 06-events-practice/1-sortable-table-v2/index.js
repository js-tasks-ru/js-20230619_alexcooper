import createElementFromString from '../../lib/create-element.js';
import { compare } from '../../lib/sort.js';

export default class SortableTable {
  element;
  subElements = {};
  sortedColumnElement;

  #onHeaderPointerDown = (event) => {
    const columnElement = event.target.closest('[data-sortable="true"]');

    if (!columnElement) {
      return;
    }

    const { id: field, order = 'asc' } = columnElement.dataset;
    const newOrder = order === 'asc' ? 'desc' : 'asc';

    this.sort(field, newOrder);
  }

  constructor(headerConfig = [], {
    data = [],
    sorted = {
      id: headerConfig.find(item => item.sortable).id,
      order: 'asc'
    },
    isSortLocally = true
  } = {}) {
    this.headerConfig = headerConfig;
    this.data = data;
    this.sorted = sorted;
    this.isSortLocally = isSortLocally;

    this.#render();
    this.#addEventListeners();
  }

  get #template() {
    return `
      <div class="sortable-table">
        ${this.#getTableHeaderHTML()}
        ${this.#getTableBodyHTML()}
      </div>
    `;
  }

  #getTableHeaderHTML() {
    const tableRows = this.headerConfig
      .map(this.#getTableHeaderRowHTML)
      .join('');

    return `
      <div data-element="header" class="sortable-table__header sortable-table__row">
        ${tableRows}
      </div>
    `;
  }

  #getTableHeaderRowHTML({id, title, sortable}) {
    return `
      <div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}">
        <span>${title}</span>
        <span data-element="arrow" class="sortable-table__sort-arrow">
          <span class="sort-arrow"></span>
        </span>
      </div>
    `;
  }

  #getTableBodyHTML() {
    return `
      <div data-element="body" class="sortable-table__body">
        ${this.#getTableBodyRowsHTML()}
      </div>
    `;
  }

  #getTableBodyRowsHTML(data = this.data) {
    return data.map(rowData => (`
        <a href="/products/${rowData.id}" class="sortable-table__row">
            ${this.#getTableBodyRowHTML(rowData)}
        </a>
    `)).join('');
  }

  #getTableBodyRowHTML(rowData) {
    return this.headerConfig.map(({id, template}) => {
      const value = rowData[id];

      if (template) {
        return template(value);
      }

      return `<div class="sortable-table__cell">${value}</div>`;
    }).join('');
  }

  #render() {
    const { id: field, order } = this.sorted;

    this.data = this.#sortData(field, order);

    this.element = createElementFromString(this.#template);
    this.subElements = this.#getSubElements(this.element);

    this.#updateColumnSortedElement(field, order);
  }

  #getSubElements(element) {
    const subElements = {};
    const elements = element.querySelectorAll('[data-element]');

    elements.forEach(element => {
      const elementName = element.dataset.element;

      subElements[elementName] = element;
    });

    return subElements;
  }

  #sortData(field, order) {
    const sortedData = [...this.data];

    const column = this.headerConfig.find(column => column.id === field);
    const { sortable, sortType } = column;

    if (!sortable) {
      return sortedData;
    }

    const dataCompareFunction = (a, b) => {
      const direction = order === 'asc' ? 1 : -1;

      return direction * compare(a[field], b[field], sortType);
    };

    sortedData.sort(dataCompareFunction);

    return sortedData;
  }

  #sortOnClient(field, order) {
    const sortedData = this.#sortData(field, order);

    this.subElements.body.innerHTML = this.#getTableBodyRowsHTML(sortedData);

    this.#updateColumnSortedElement(field, order);
  }

  #sortOnServer() {
    throw new Error('Not implemented');
  }

  #updateColumnSortedElement(field, order) {
    const sortedColumnElement = this.subElements.header.querySelector(`[data-id="${field}"]`);

    if (this.sortedColumnElement) {
      delete this.sortedColumnElement.dataset.order;
    }

    sortedColumnElement.dataset.order = order;
    this.sortedColumnElement = sortedColumnElement;
  }

  #addEventListeners() {
    this.subElements.header.addEventListener('pointerdown', this.#onHeaderPointerDown);
  }

  #removeEventListeners() {
    const headerElement = this.subElements.header;

    if (headerElement) {
      headerElement.removeEventListener('pointerdown', this.#onHeaderPointerDown);
    }
  }

  #remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  sort(field, order = 'asc') {
    if (this.isSortLocally) {
      this.#sortOnClient(field, order);
    } else {
      this.#sortOnServer();
    }
  }

  destroy() {
    this.#remove();
    this.#removeEventListeners();

    this.data = null;
    this.subElements = {};
  }
}
