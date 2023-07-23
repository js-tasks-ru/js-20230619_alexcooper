import fetchJson from '../lib/fetch-json.js';
import { BaseComponent } from "./base.js";

export default class ColumnChart extends BaseComponent {
  element;
  subElements;
  data = {};
  chartHeight = 50;

  static #defaultFormatHeading = text => text;
  static #chartIsLoadingClass = 'column-chart_loading';

  constructor({
    label = '',
    link,
    formatHeading = ColumnChart.#defaultFormatHeading,
    url,
    range = {
      from: new Date(),
      to: new Date(),
    }
  } = {}) {
    super();

    this.label = label;
    this.link = link;
    this.formatHeading = formatHeading;
    this.url = url;
    this.range = range;

    this.initialize();
  }

  getTemplate() {
    return `
      <div class="column-chart ${ColumnChart.#chartIsLoadingClass}" style="--chart-height: ${this.chartHeight}">
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
    const chartDataValues = Object.values(this.data);
    const chartTotalNumber = chartDataValues.reduce((acc, value) => acc + value, 0);

    return this.formatHeading
      ? this.formatHeading(chartTotalNumber)
      : chartTotalNumber;
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

  #updateLoadingClass(isLoading = false) {
    if (!isLoading) {
      this.element.classList.remove(ColumnChart.#chartIsLoadingClass);
    } else {
      this.element.classList.add(ColumnChart.#chartIsLoadingClass);
    }
  }

  async #getDataFromServer(dateFrom, dateTo) {
    const url = new URL(this.url, ColumnChart.backendURL);

    url.searchParams.set('from', dateFrom.toISOString());
    url.searchParams.set('to', dateTo.toISOString());

    return await fetchJson(url);
  }

  async update(dateFrom, dateTo) {
    this.#updateLoadingClass(true);

    this.data = await this.#getDataFromServer(dateFrom, dateTo);

    if (Object.keys(this.data).length === 0) {
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
}
