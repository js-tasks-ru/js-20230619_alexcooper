import { BaseComponent } from "../../lib/components.js";

import ColumnChart from '../../07-async-code-fetch-api-part-1/1-column-chart/index.js';
import SortableTable from '../../07-async-code-fetch-api-part-1/2-sortable-table-v3/index.js';
import RangePicker from '../../08-forms-fetch-api-part-2/2-range-picker/index.js';

import sortableTableHeader from './bestsellers-header.js';

export default class Page extends BaseComponent {
  components = {};
  url;

  static itemsPerPage = 25;

  #onRangePickerDateSelect = (event) => {
    const {from, to} = event.detail;

    this.#updateComponents(from, to);
  }

  constructor() {
    super();

    this.url = new URL('api/dashboard/bestsellers', Page.backendURL);

    this.initialize();
  }

  getTemplate() {
    return `
      <div class="dashboard">
        <div class="content__top-panel">
          <h2 class="page-title">Dashboard</h2>
          <div data-element="rangePicker"></div>
        </div>
        <div data-element="chartsRoot" class="dashboard__charts">
          <div data-element="ordersChart" class="dashboard__chart_orders"></div>
          <div data-element="salesChart" class="dashboard__chart_sales"></div>
          <div data-element="customersChart" class="dashboard__chart_customers"></div>
        </div>
        <h3 class="block-title">Best sellers</h3>
        <div data-element="sortableTable"></div>
      </div>
    `;
  }

  async initialize() {
    this.#toggleLoadingState();

    await this.#initializeComponents();

    this.#toggleLoadingState();

    this.addEventListeners();
  }

  async #initializeComponents() {
    const now = new Date();
    const prevMonth = now.setMonth(now.getMonth() - 1);

    const dateFrom = new Date(prevMonth);
    const dateTo = new Date();

    const rangePicker = this.#createRangePicker(dateFrom, dateTo);

    const ordersChart = this.#createColumnChart(
      'api/dashboard/orders',
      dateFrom,
      dateTo,
      'Orders',
    );

    const salesChart = this.#createColumnChart(
      'api/dashboard/sales',
      dateFrom,
      dateTo,
      'Sales',
    );

    const customersChart = this.#createColumnChart(
      'api/dashboard/customers',
      dateFrom,
      dateTo,
      'Customers',
    );

    const sortableTable = this.#createSortableTable(dateFrom, dateTo);

    this.components = {
      rangePicker,
      ordersChart,
      salesChart,
      customersChart,
      sortableTable,
    };
  }

  #createRangePicker(from, to) {
    return new RangePicker({
      from,
      to
    });
  }

  #createColumnChart(url, from, to, label, link = '#') {
    return new ColumnChart({
      url: url,
      range: {
        from,
        to
      },
      label: 'orders',
      link: link,
    });
  }

  #createSortableTable(dateFrom, dateTo, itemsPerPage = Page.itemsPerPage) {
    this.url.searchParams.set('from', dateFrom.toISOString());
    this.url.searchParams.set('to', dateTo.toISOString());

    return new SortableTable(sortableTableHeader, {
      url: this.url.toString(),
      step: itemsPerPage,
      isSortLocally: true,
    });
  }

  render() {
    super.render();

    this.subElements = this.getSubElements();

    this.#renderComponents();

    return this.element;
  }

  async #updateComponents(from, to) {
    this.#toggleLoadingState();

    this.components.sortableTable.update(
      'title',
      'asc',
      0,
      Page.itemsPerPage,
      from,
      to,
      false,
    );

    await this.components.ordersChart.update(from, to);
    await this.components.salesChart.update(from, to);
    await this.components.customersChart.update(from, to);

    this.#toggleLoadingState();
  }

  #renderComponents() {
    Object.keys(this.components).forEach(component => {
      const componentContainer = this.subElements[component];
      const element = this.components[component].element;

      componentContainer.append(element);
    });
  }

  #toggleLoadingState() {
    const mainElement = document.querySelector('.main');

    mainElement.classList.toggle('is-loading');
  }

  addEventListeners() {
    this.components.rangePicker.element.addEventListener('date-select', this.#onRangePickerDateSelect);
  }

  destroy() {
    super.destroy();

    for (const component of Object.values(this.components)) {
      component.destroy();
    }
  }
}
