import { BaseComponent } from "../../lib/components.js";

const CHART_IS_LOADING_CLASS = 'column-chart_loading';
const CHART_BODY_CLASS = 'column-chart__chart';

export default class ColumnChart extends BaseComponent {
  chartHeight = 50;

  constructor({
    data = [],
    label = '',
    value = 0,
    link,
    formatHeading
  } = {}) {
    super();

    this.data = data;
    this.label = label;
    this.value = value;
    this.link = link;
    this.formatHeading = formatHeading;

    this.initialize();
  }

  getTemplate() {
    return `
      <div class="column-chart ${CHART_IS_LOADING_CLASS}" style="--chart-height: ${this.chartHeight}">
        <div class="column-chart__title">
          Total ${this.label}
          ${this.#getLinkHTML()}
        </div>
        <div class="column-chart__container">
          <div data-element="header" class="column-chart__header">${this.#getValueHTML()}</div>
          <div data-element="body" class="${CHART_BODY_CLASS}">
            ${this.#getBodyHTML()}
          </div>
        </div>
      </div>
    `;
  }

  #getValueHTML() {
    return this.formatHeading
      ? this.formatHeading(this.value)
      : this.value;
  }

  #getLinkHTML() {
    return this.link
      ? `<a href="${this.link}" class="column-chart__link">View all</a>`
      : '';
  }

  #getBodyHTML(data = this.data) {
    const maxValue = Math.max(...data);

    return data
      .map(value => {
        const scale = this.chartHeight / maxValue;
        const styleValue = Math.floor(value * scale);
        const percent = Math.round((value / maxValue) * 100);

        return `<div style="--value: ${styleValue}" data-tooltip="${percent}%"></div>`;
      })
      .join('');
  }

  render() {
    super.render();

    this.#updateLoadingState();
  }

  #updateLoadingState() {
    if (this.data.length) {
      this.element.classList.remove(CHART_IS_LOADING_CLASS);
    }
  }

  update(newData) {
    this.data = newData;

    this.element
      .getElementsByClassName(CHART_BODY_CLASS)[0]
      .innerHTML = this.#getBodyHTML(newData);

    this.#updateLoadingState();
  }

  destroy() {
    super.destroy();

    this.data = null;
  }
}
