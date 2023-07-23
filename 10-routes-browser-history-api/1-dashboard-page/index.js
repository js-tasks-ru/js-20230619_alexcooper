import { BaseComponent } from "../../components/base.js";
import RangePicker from '../../components/range-picker.js';
import ColumnChart from '../../components/column-chart.js';
import SortableTable from '../../components/sortable-table.js';

import sortableTableHeader from './bestsellers-header.js';

export default class Page extends BaseComponent {
  components = {};

  static tableProperties = {
    sortedField: 'title',
    order: 'asc',
    start: 0,
    itemsPerPage: 25,
  }

  #onRangePickerDateSelect = async (event) => {
    const { from, to } = event.detail;

    await this.#updateComponents(from, to);
  }

  constructor() {
    super();

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
    await this.#initializeComponents();

    this.addEventListeners();
  }

  async #initializeComponents() {
    const now = new Date();
    const prevMonth = now.setMonth(now.getMonth() - 1);

    const dateFrom = new Date(prevMonth);
    const dateTo = new Date();

    const rangePicker = this.#createRangePicker(dateFrom, dateTo);

    const ordersChart = this.#createColumnChart('api/dashboard/orders', 'Orders');
    const salesChart = this.#createColumnChart('api/dashboard/sales', 'Sales');
    const customersChart = this.#createColumnChart('api/dashboard/customers', 'Customers');

    const sortableTable = this.#createSortableTable('api/dashboard/bestsellers', dateFrom, dateTo);

    this.components = {
      rangePicker,
      ordersChart,
      salesChart,
      customersChart,
      sortableTable,
    };

    return this.#updateComponents(dateFrom, dateTo);
  }

  #createRangePicker(from, to) {
    return new RangePicker({
      from,
      to
    });
  }

  #createColumnChart(url, label, link = '#') {
    return new ColumnChart({
      url,
      label: label,
      link: link,
    });
  }

  #createSortableTable(url) {
    return new SortableTable(sortableTableHeader, {
      url,
      step: Page.tableProperties.itemsPerPage,
      isSortLocally: true,
    });
  }

  render() {
    super.render();

    this.subElements = this.getSubElements();

    this.#renderComponents();

    return this.element;
  }

  async #updateComponents(dateFrom, dateTo) {
    this.#toggleLoadingState();

    await Promise.all([
      this.components.ordersChart.update(dateFrom, dateTo),
      this.components.salesChart.update(dateFrom, dateTo),
      this.components.customersChart.update(dateFrom, dateTo),
      this.components.sortableTable.update(
        Page.tableProperties.sortedField,
        Page.tableProperties.order,
        Page.tableProperties.start,
        Page.tableProperties.itemsPerPage,
        dateFrom,
        dateTo,
        false,
      ),
    ]);

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
