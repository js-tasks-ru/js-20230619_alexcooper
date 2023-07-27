import { BaseComponent } from "./base.js";
import { compare } from "../lib/sort.js";
import fetchJson from '../lib/fetch-json.js';

export default class SortableTable extends BaseComponent {
  element;
  subElements = {};
  sortedColumnElement;

  #isLoading = false;
  #hasMoreRowsData = true;

  static #tableDataIsLoadingClass = 'sortable-table_loading';
  static #scrollOffset = 300;

  #onHeaderPointerDown = (event) => {
    const columnElement = event.target.closest('[data-sortable="true"]');

    if (!columnElement) {
      return;
    }

    const { id: fieldId, order = 'asc' } = columnElement.dataset;
    const newOrder = order === 'asc' ? 'desc' : 'asc';

    this.sorted = {
      id: fieldId,
      order: newOrder,
    };

    this.sort(fieldId, newOrder);
  }

  #onWindowScroll = async() => {
    if (this.#isLoading || !this.#hasMoreRowsData) {
      return false;
    }

    const { bottom: elementBottom } = this.element.getBoundingClientRect();
    const { clientHeight } = document.documentElement;

    if (elementBottom < clientHeight + SortableTable.#scrollOffset) {
      this.start = this.end;
      this.end = this.start + this.step;

      await this.update(
        this.sorted.id,
        this.sorted.order,
        this.start,
        this.end,
      );
    }
  }

  constructor(headerConfig = [], {
    url = '',
    sorted = {
      id: headerConfig.find(item => item.sortable).id,
      order: 'asc'
    },
    start = 0,
    step = 30,
    end = start + step,
    isSortLocally = false
  } = {}) {
    super();

    this.url = url;
    this.headerConfig = headerConfig;
    this.sorted = sorted;
    this.start = start;
    this.end = end;
    this.step = step;
    this.isSortLocally = isSortLocally;

    this.data = [];

    this.initialize();
  }

  getTemplate() {
    return `
      <div class="sortable-table">
        ${this.#getTableHeaderHTML()}
        ${this.#getTableBodyHTML()}

        <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
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

  sortOnClient(fieldId, order) {
    const sortedData = this.#sortData(fieldId, order);

    this.subElements.body.innerHTML = this.#getTableBodyRowsHTML(sortedData);

    this.#updateColumnSortedElement(fieldId, order);
  }

  async sortOnServer(fieldId, order) {
    const start = 0;
    const end = this.start + this.step;

    await this.update(
      fieldId,
      order,
      start,
      end,
      false,
    );

    this.#updateColumnSortedElement(fieldId, order);
  }

  #updateColumnSortedElement(field, order) {
    const sortedColumnElement = this.subElements.header.querySelector(`[data-id="${field}"]`);

    if (this.sortedColumnElement) {
      delete this.sortedColumnElement.dataset.order;
    }

    sortedColumnElement.dataset.order = order;
    this.sortedColumnElement = sortedColumnElement;
  }

  addEventListeners() {
    document.addEventListener('scroll', this.#onWindowScroll);

    this.subElements.header.addEventListener('pointerdown', this.#onHeaderPointerDown);
  }

  removeEventListeners() {
    document.removeEventListener('scroll', this.#onWindowScroll);

    const headerElement = this.subElements?.header;
    if (headerElement) {
      headerElement.removeEventListener('pointerdown', this.#onHeaderPointerDown);
    }
  }

  async #getDataFromServer(sortFieldId, sortOrder, start, end, dateFrom, dateTo) {
    const url = new URL(this.url, SortableTable.backendURL);

    url.searchParams.set('_sort', sortFieldId);
    url.searchParams.set('_order', sortOrder);
    url.searchParams.set('_start', start);
    url.searchParams.set('_end', end);

    if (dateFrom) {
      url.searchParams.set('from', dateFrom.toISOString());
    }

    if (dateTo) {
      url.searchParams.set('to', dateTo.toISOString());
    }

    this.#updateLoadingState(true);

    const data = await fetchJson(url);

    this.#updateLoadingState(false);

    return data;
  }

  #updateLoadingState(isLoading) {
    this.#isLoading = isLoading;

    if (!isLoading) {
      this.element.classList.remove(SortableTable.#tableDataIsLoadingClass);
    } else {
      this.element.classList.add(SortableTable.#tableDataIsLoadingClass);
    }
  }

  async update(
    sortField = this.sorted.id,
    sortOrder = this.sorted.order,
    start = this.start,
    end = this.end,
    dateFrom,
    dateTo,
    append = true,
  ) {
    const newData = await this.#getDataFromServer(sortField, sortOrder, start, end, dateFrom, dateTo);

    if (newData.length === 0) {
      this.#hasMoreRowsData = false;
      return;
    }

    const rowsHTML = this.#getTableBodyRowsHTML(newData);

    if (append) {
      this.data = this.data.concat(newData);

      this.subElements.body.insertAdjacentHTML('beforeend', rowsHTML);
    } else {
      this.data = newData;

      this.subElements.body.innerHTML = rowsHTML;
    }

    this.#updateColumnSortedElement(sortField, sortOrder);
  }

  sort(field, order = 'asc') {
    if (this.isSortLocally) {
      this.sortOnClient(field, order);
    } else {
      this.sortOnServer(field, order);
    }
  }
}
