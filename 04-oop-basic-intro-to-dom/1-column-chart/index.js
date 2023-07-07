import createElementFromString from '../../lib/create-element.js';

const CHART_IS_LOADING_CLASS = 'column-chart_loading';
const CHART_BODY_CLASS = 'column-chart__chart';

export default class ColumnChart {
  element;
  bodyElement;
  chartHeight = 50;

  constructor({
    data = [],
    label = '',
    value = 0,
    link,
    formatHeading
  } = {}) {
    this.data = data;
    this.label = label;
    this.value = value;
    this.link = link;
    this.formatHeading = formatHeading;

    this.render();
  }

  get template() {
    return `
      <div class="column-chart ${CHART_IS_LOADING_CLASS}" style="--chart-height: ${this.chartHeight}">
        <div class="column-chart__title">
          Total ${this.label}
          ${this.getLinkHTML()}
        </div>
        <div class="column-chart__container">
          <div data-element="header" class="column-chart__header">${this.getValueHTML()}</div>
          <div data-element="body" class="${CHART_BODY_CLASS}">
            ${this.getBodyHTML()}
          </div>
        </div>
      </div>
    `;
  }

  getValueHTML() {
    return this.formatHeading
      ? this.formatHeading(this.value)
      : this.value;
  }

  getLinkHTML() {
    return this.link
      ? `<a href="${this.link}" class="column-chart__link">View all</a>`
      : '';
  }

  getBodyHTML() {
    const maxValue = Math.max(...this.data);

    return this.data
      .map(value => {
        const scale = this.chartHeight / maxValue;
        const styleValue = Math.floor(value * scale);
        const percent = Math.round((value / maxValue) * 100);

        return `<div style="--value: ${styleValue}" data-tooltip="${percent}%"></div>`;
      })
      .join('');
  }

  render() {
    this.element = createElementFromString(this.template);

    this.updateLoadingState();
  }

  update(newData) {
    this.data = newData;

    this.element.getElementsByClassName(CHART_BODY_CLASS)[0].innerHTML = this.getBodyHTML();

    this.updateLoadingState();
  }

  updateLoadingState() {
    if (this.data.length) {
      this.element.classList.remove(CHART_IS_LOADING_CLASS);
    }
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
}
