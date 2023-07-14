import fetchJson from './utils/fetch-json.js';
import createElementFromString from "../../lib/create-element.js";
import * as url from "url";

const BACKEND_URL = 'https://course-js.javascript.ru';
const CHART_IS_LOADING_CLASS = 'column-chart_loading';

export default class ColumnChart {
  element;
  subElements;
  data = {};
  chartHeight = 50;

  get #isDataEmpty() {
    return Object.keys(this.data).length === 0;
  }

  constructor({
    label = '',
    link,
    formatHeading = text => text,
    url,
    range = {
      from: new Date(),
      to: new Date(),
    }
  } = {}) {
    this.label = label;
    this.link = link;
    this.formatHeading = formatHeading;
    this.url = new URL(url, BACKEND_URL);
    this.range = range;

    this.#initialize();
  }

  get #template() {
    return `
      <div class="column-chart ${CHART_IS_LOADING_CLASS}" style="--chart-height: ${this.chartHeight}">
        <div class="column-chart__title">
          Total ${this.label}
          ${this.#getLinkHTML()}
        </div>
        <div class="column-chart__container">
          <div data-element="header" class="column-chart__header"></div>
          <div data-element="body" class="column-chart__chart"></div>
        </div>
      </div>
    `;
  }

  #getHeaderHTML() {
    const values = Object.values(this.data);
    const total = values.reduce((accum, value) => {
      return accum + value;
    }, 0);

    return this.formatHeading
      ? this.formatHeading(total)
      : total;
  }

  #getLinkHTML() {
    return this.link
      ? `<a href="${this.link}" class="column-chart__link">View all</a>`
      : '';
  }

  #getBodyHTML(data = this.data) {
    const maxValue = Math.max(...Object.values(data));

    return Object.entries(data)
      .map(([, value]) => {
        const scale = this.chartHeight / maxValue;
        const styleValue = Math.floor(value * scale);
        const percent = Math.round((value / maxValue) * 100);

        return `<div style="--value: ${styleValue}" data-tooltip="${percent}%"></div>`;
      })
      .join('');
  }

  #initialize() {
    this.#render();
    this.subElements = this.#getSubElements();

    this.update(this.range.from, this.range.to);
  }

  #render() {
    this.element = createElementFromString(this.#template);
  }

  #getSubElements() {
    const elements = this.element.querySelectorAll('[data-element]');
    const items = Array.from(elements);

    return items.reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  #updateLoadingClass(isLoading = false) {
    if (!isLoading && !this.#isDataEmpty) {
      this.element.classList.remove(CHART_IS_LOADING_CLASS);
    } else {
      this.element.classList.add(CHART_IS_LOADING_CLASS);
    }
  }

  #setURLParams(dateFrom, dateTo) {
    this.url.searchParams.set('from', dateFrom.toISOString());
    this.url.searchParams.set('to', dateTo.toISOString());
  }

  async #loadData(dateFrom, dateTo) {
    this.#setURLParams(dateFrom, dateTo);

    this.data = await fetchJson(url);
  }

  async update(dateFrom, dateTo) {
    this.#updateLoadingClass(true);

    await this.#loadData(dateFrom, dateTo);

    if (this.#isDataEmpty) {
      return {};
    }

    const {
      header: headerElement,
      body: bodyElement,
    } = this.subElements;

    headerElement.innerHTML = this.#getHeaderHTML();
    bodyElement.innerHTML = this.#getBodyHTML();

    this.#updateLoadingClass(false);

    return this.data;
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
    this.data = null;
  }
}
