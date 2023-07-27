import { compare } from '../../lib/sort.js';
import { BaseComponent } from "../../components/base.js";

export default class SortableTable {
  element;
  subElements = {};
  sortedColumnElement;

  constructor(headerConfig = [], data = []) {
    this.headerConfig = headerConfig;
    this.data = data;

    this.#render();
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
    const tableRowsHTML = this.headerConfig
      .map(options => this.#getTableHeaderRowHTML(options))
      .join('');

    return `
      <div data-element="header" class="sortable-table__header sortable-table__row">
        ${tableRowsHTML}
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
    return data.map(rowData => {
      return `
        <a href="/products/${rowData.id}" class="sortable-table__row">
            ${this.#getTableBodyRowHTML(rowData)}
        </a>
      `;
    }).join('');
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
    this.element = BaseComponent.createElement(this.#template);
    this.subElements = this.#getSubElements(this.element);
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

  #remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  #sortData(field, order) {
    const sortedData = [...this.data];

    const column = this.headerConfig.find(column => column.id === field);
    const { sortable, sortType } = column;

    if (!sortable) {
      return sortedData;
    }

    sortedData.sort((a, b) => {
      const direction = order === 'asc' ? 1 : -1;

      return direction * compare(a[field], b[field], sortType);
    });

    return sortedData;
  }

  sort(field, order = 'asc') {
    const sortedData = this.#sortData(field, order);
    const sortedColumnElement = this.subElements.header.querySelector(`[data-id="${field}"]`);

    if (this.sortedColumnElement) {
      delete this.sortedColumnElement.dataset.order;
    }

    sortedColumnElement.dataset.order = order;
    this.sortedColumnElement = sortedColumnElement;

    this.subElements.body.innerHTML = this.#getTableBodyRowsHTML(sortedData);
  }

  destroy() {
    this.#remove();
    this.data = null;
  }
}
