import { BaseComponent } from "../../lib/components.js";
import escapeHtml from './utils/escape-html.js';
import fetchJson from './utils/fetch-json.js';

export default class ProductForm extends BaseComponent {
  formData = {};
  categories = [];

  static #productsAPIRelativeURL = '/api/rest/products';
  static #categoriesAPIRelativeURL = '/api/rest/categories';

  static #imgurUploadURL = 'https://api.imgur.com/3/upload';
  static #imgurClientId = '28aaa2e823b03b1';

  static #defaultFormData = {
    title: '',
    description: '',
    quantity: 1,
    subcategory: '',
    status: 1,
    price: 100,
    discount: 0,
  };

  static #simpleFields = Object.keys(this.#defaultFormData);
  static #numberFields = ['quantity', 'status', 'price', 'discount'];

  #onFormSubmit = event => {
    event.preventDefault();

    this.save();
  };

  #onUploadImageButtonPointerDown = event => {
    event.preventDefault();

    this.subElements.imageInput.click();
  }

  #onImageInputChange = async event => {
    const inputElement = event.target;
    const [file] = inputElement.files;

    if (file) {
      const imagesListElement = this.subElements.images;

      this.#toggleUploadImageButtonState();

      const uploadedImageURL = await this.#uploadToImgur(file);
      if (uploadedImageURL) {
        const imageElementHTML = this.#getImageItemHTML(file.name, uploadedImageURL);

        imagesListElement.insertAdjacentHTML('beforeend', imageElementHTML);
      }

      this.#toggleUploadImageButtonState();

      inputElement.value = '';
    }
  }

  #onImageRemovePointerDown = (event) => {
    if ('deleteHandle' in event.target.dataset) {
      event.target.closest('li').remove();
    }
  }

  constructor (productId) {
    super();

    this.productId = productId;
  }

  async render () {
    const [categories, [productData]] = await Promise.all([
      this.#loadCategories(),
      this.#loadProductData(),
    ]);

    this.formData = productData;
    this.categories = categories;

    super.render();
    this.subElements = this.getSubElements();

    if (this.formData) {
      await this.#update();
      this.addEventListeners();
    }

    return this.element;
  }

  getTemplate() {
    return `
      <div class="product-form">
        <form data-element="productForm" class="form-grid">

          ${this.#getMainFieldsTemplate()}

          ${this.#getPhotoTemplate()}

          ${this.#getCategoriesTemplate()}

          ${this.#getPriceTemplate()}

          ${this.#getQuantityTemplate()}

          ${this.#getStatusTemplate()}

          <div class="form-buttons">
            <button type="submit" name="save" class="button-primary-outline">Сохранить товар</button>
          </div>
        </form>
      </div>
    `;
  }

  #getMainFieldsTemplate() {
    return `
        <div class="form-group form-group__half_left">
          <fieldset>
            <label class="form-label">Название товара</label>
            <input id="title" type="text" name="title" class="form-control" placeholder="Название товара" required>
          </fieldset>
        </div>

        <div class="form-group form-group__wide">
          <label class="form-label">Описание</label>
          <textarea id="description" class="form-control" name="description" data-element="productDescription" placeholder="Описание товара"></textarea>
        </div>
    `;
  }

  #getPhotoTemplate() {
    return `
      <div class="form-group form-group__wide" data-element="sortable-list-container">
        <label class="form-label">Фото</label>
        <div data-element="imageListContainer">
          <ul class="sortable-list" data-element="images"></ul>
        </div>

        <input
            type="file"
            accept="image/*"
            data-element="imageInput"
            style="clip: rect(0, 0, 0, 0); position: absolute;"
        >
        <button type="button" name="uploadImage" class="button-primary-outline" data-element="uploadImageButton">
          <span>Загрузить</span>
        </button>
      </div>
    `;
  }

  #getCategoriesTemplate() {
    return `
      <div class="form-group form-group__half_left">
        <label class="form-label">Категория</label>
        <select id="subcategory" class="form-control" name="subcategory" data-element="categories"></select>
      </div>
    `;
  }

  #getPriceTemplate() {
    return `
      <div class="form-group form-group__half_left form-group__two-col">

        <fieldset>
          <label class="form-label">Цена ($)</label>
          <input id="price" type="number" name="price" class="form-control" placeholder="100" required>
        </fieldset>

        <fieldset>
          <label class="form-label">Скидка ($)</label>
          <input id="discount" type="number" name="discount" class="form-control" placeholder="0" required>
        </fieldset>

      </div>
    `;
  }

  #getQuantityTemplate() {
    return `
      <div class="form-group form-group__part-half">
        <label class="form-label">Количество</label>
        <input id="quantity" type="number" class="form-control" name="quantity" placeholder="1" required>
      </div>
    `;
  }

  #getStatusTemplate() {
    return `
      <div class="form-group form-group__part-half">
        <label class="form-label">Статус</label>
        <select id="status" class="form-control" name="status">
          <option value="1">Активен</option>
          <option value="0">Неактивен</option>
        </select>
      </div>
    `;
  }

  #getImageItemHTML(name, url) {
    return `
      <li class="products-edit__imagelist-item sortable-list__item">
        <span>
          <img src="./icon-grab.svg" data-grab-handle alt="grab">
          <img class="sortable-table__cell-img" alt="${escapeHtml(name)}" src="${escapeHtml(url)}" data-name="product-image">
          <span>${escapeHtml(name)}</span>
        </span>

        <button type="button">
          <img src="./icon-trash.svg" alt="delete" data-delete-handle>
        </button>
      </li>
    `;
  }

  /**
   *
   * @returns {Promise<Object[]>}
   */
  #loadProductData() {
    if (this.productId) {
      const url = new URL(ProductForm.#productsAPIRelativeURL, ProductForm.backendURL);

      url.searchParams.set('id', this.productId);

      return fetchJson(url);
    }

    return Promise.resolve([ProductForm.#defaultFormData]);
  }

  /**
   *
   * @returns {Promise<Object[]>}
   */
  #loadCategories() {
    const url = new URL(ProductForm.#categoriesAPIRelativeURL, ProductForm.backendURL);

    url.searchParams.set('_sort', 'weight');
    url.searchParams.set('_refs', 'subcategory');

    return fetchJson(url);
  }

  async #update() {
    this.#updateSimpleValues();
    this.#updateCategoriesList();
    this.#updateImagesList();
  }

  #updateSimpleValues() {
    const { productForm } = this.subElements;
    const formElements = productForm.elements;
    const formData = this.formData;

    for (const field of ProductForm.#simpleFields) {
      formElements[field].value = formData[field];
    }
  }

  #updateImagesList() {
    const images = this.formData.images;

    if (images) {
      const {images: imagesElement} = this.subElements;

      imagesElement.innerHTML = images
        .map(image => this.#getImageItemHTML(image.source, image.url))
        .join('');
    }
  }

  #updateCategoriesList() {
    const selectedCategoryId = this.formData.subcategory;
    const { categories: categoriesElement } = this.subElements;

    const selectElement = document.createElement('select');

    for (const category of this.categories) {
      for (const subcategory of category.subcategories) {
        const isSelected = subcategory.id === selectedCategoryId;

        const optionElement = new Option(
          `${category.title} > ${subcategory.title}`,
          subcategory.id,
          isSelected,
        );

        selectElement.append(optionElement);
      }
    }

    categoriesElement.innerHTML = selectElement.innerHTML;
  }

  async save() {
    const requestData = this.#getFormData();

    const url = new URL(ProductForm.#productsAPIRelativeURL, ProductForm.backendURL);
    const method = this.productId ? 'PATCH' : 'PUT';
    const body = JSON.stringify(requestData);

    const requestParams = {
      method,
      body,
      headers: { 'Content-Type': 'application/json' },
    };

    try {
      const result = await fetchJson(url, requestParams);

      this.#dispatchEvent(result.id);
      this.productId = result.id;
    } catch (e) {
      console.error('Server error: ', e);
    }
  }

  #getFormData() {
    const { productForm } = this.subElements;
    const formElements = productForm.elements;

    const result = {
      id: this.productId,
      images: this.#getImagesData(),
    };

    for (const field of ProductForm.#simpleFields) {
      const value = formElements[field].value;
      const isNumberField = ProductForm.#numberFields.includes(field);

      if (isNumberField) {
        result[field] = parseInt(value);
      } else {
        result[field] = value;
      }
    }

    return result;
  }

  #getImagesData() {
    const elements = this.element.querySelectorAll('[data-name="product-image"]');
    const images = [];

    for (const image of elements) {
      images.push({
        url: image.src,
        source: image.alt
      });
    }

    return images;
  }

  async #uploadToImgur(file) {
    const formData = new FormData();

    formData.append('image', file);

    const requestParams = {
      method: 'POST',
      headers: {
        Authorization: `Client-ID ${ProductForm.#imgurClientId}`,
      },
      referrer: '',
      body: formData
    };

    try {
      const response = await fetchJson(ProductForm.#imgurUploadURL, requestParams);

      return response.data.link;
    } catch (e) {
      console.error('Imgur API error: ', e.body.data.error);
    }
  }

  #toggleUploadImageButtonState() {
    const { uploadImageButton: uploadImageButtonElement } = this.subElements;

    uploadImageButtonElement.disabled = !uploadImageButtonElement.disabled;
    uploadImageButtonElement.classList.toggle('is-loading');
  }

  #dispatchEvent (id) {
    const eventName = this.productId
      ? 'product-updated'
      : 'product-saved';

    const event = new CustomEvent(eventName, { detail: id });

    this.element.dispatchEvent(event);
  }

  addEventListeners() {
    const {
      productForm: productFormElement,
      uploadImageButton: uploadImageButtonElement,
      imageInput: imageInputElement,
      imageListContainer: imageListContainerElement,
    } = this.subElements;

    productFormElement.addEventListener('submit', this.#onFormSubmit);
    uploadImageButtonElement.addEventListener('pointerdown', this.#onUploadImageButtonPointerDown);
    imageInputElement.addEventListener('change', this.#onImageInputChange);
    imageListContainerElement.addEventListener('pointerdown', this.#onImageRemovePointerDown);
  }
}
