import { BaseComponent } from "../../lib/components.js";

export default class SortableList extends BaseComponent {
  draggingElement;
  placeholderElementIndex;

  placeholderElement;

  pointerInitialShift = {
    x: 0,
    y: 0,
  };

  static listElementClassName = 'sortable-list__item';
  static listElementDraggingClassName = 'sortable-list__item_dragging';

  #onDocumentPointerDown = (event) => {
    const target = event.target;

    const listItemElement = target.closest(`.${SortableList.listElementClassName}`);

    if (!listItemElement) {
      return;
    }

    const isGrabHandle = target.closest('[data-grab-handle]');
    const isDeleteHandle = target.closest('[data-delete-handle]');

    if (isGrabHandle) {
      event.preventDefault();

      this.#startListElementDragging(listItemElement, event.clientX, event.clientY);
    }

    if (isDeleteHandle) {
      event.preventDefault();

      this.#removeItem(listItemElement);
    }
  }

  #onDocumentPointerUp = (event) => {
    if (this.draggingElement) {
      this.#stopListElementDragging();
    }
  }

  #onDocumentPointerMove = (event) => {
    if (!this.draggingElement) {
      return;
    }

    const { clientX, clientY } = event;
    const listElements = this.element.children;

    this.#moveDraggingElement(clientX, clientY);

    const {
      top: draggingElementTopOffset,
      bottom: draggingElementBottomOffset
    } = this.draggingElement.getBoundingClientRect();

    const prevElement = this.placeholderElementIndex > 0
      ? listElements[this.placeholderElementIndex - 1]
      : null;

    const nextElement = this.placeholderElementIndex !== listElements.length - 1
      ? listElements[this.placeholderElementIndex]
      : null;

    const moveUp = prevElement && (
      prevElement.getBoundingClientRect().bottom - (prevElement.offsetHeight / 2)
      > draggingElementTopOffset
    );

    const moveDown = nextElement && (
      nextElement.getBoundingClientRect().bottom - (nextElement.offsetHeight / 2)
      < draggingElementBottomOffset
    );

    if (moveUp) {
      const newIndex = this.placeholderElementIndex - 1;

      this.#movePlaceholderElementTo(newIndex);
    } else if (moveDown) {
      const newIndex = this.placeholderElementIndex + 1;

      this.#movePlaceholderElementTo(newIndex);
    }
  }

  constructor({
    items = [],
  } = {}) {
    super();

    this.items = items;

    this.initialize();
  }

  render() {
    super.render();

    this.#addItems();
  }

  getTemplate() {
    return '<ul class="sortable-list"></ul>';
  }

  getPlaceholderTemplate() {
    return '<li class="sortable-list__placeholder"></li>';
  }

  #addItems(items = this.items) {
    items.forEach(itemElement => {
      itemElement.classList.add(SortableList.listElementClassName);
    });

    this.element.append(...items);
  }

  #removeItem(listItemElement) {
    listItemElement.remove();
  }

  #startListElementDragging(listElement, pointerLeftPosition, pointerTopPosition) {
    const { left, top } = listElement.getBoundingClientRect();

    this.pointerInitialShift = {
      x: pointerLeftPosition - left,
      y: pointerTopPosition - top
    };

    const elementInitialWidth = `${listElement.offsetWidth}px`;
    const elementInitialHeight = `${listElement.offsetHeight}px`;

    const placeholderElement = this.#renderPlaceholderElement(elementInitialWidth, elementInitialHeight);

    listElement.classList.add(SortableList.listElementDraggingClassName);

    listElement.style.width = elementInitialWidth;
    listElement.style.height = elementInitialHeight;

    this.draggingElement = listElement;
    this.placeholderElement = placeholderElement;

    this.placeholderElementIndex = Array
      .from(this.element.children)
      .indexOf(listElement);

    listElement.after(placeholderElement);
    this.element.append(listElement);

    this.#moveDraggingElement(pointerLeftPosition, pointerTopPosition);

    document.addEventListener('pointermove', this.#onDocumentPointerMove);
    document.addEventListener('pointerup', this.#onDocumentPointerUp);
  }

  #movePlaceholderElementTo(index) {
    const insertBeforeElement = this.element.children[index];
    this.placeholderElementIndex = index;

    if (insertBeforeElement !== this.placeholderElement) {
      this.element.insertBefore(this.placeholderElement, insertBeforeElement);
    }
  }

  #stopListElementDragging() {
    this.placeholderElement.replaceWith(this.draggingElement);

    this.draggingElement.classList.remove(SortableList.listElementDraggingClassName);
    this.draggingElement.style.left = null;
    this.draggingElement.style.top = null;

    this.draggingElement = null;

    document.removeEventListener('pointermove', this.#onDocumentPointerMove);
    document.removeEventListener('pointerup', this.#onDocumentPointerUp);
  }

  #moveDraggingElement(x, y) {
    const xPosition = x - this.pointerInitialShift.x;
    const yPosition = y - this.pointerInitialShift.y;

    this.draggingElement.style.left = `${xPosition}px`;
    this.draggingElement.style.top = `${yPosition}px`;
  }

  #renderPlaceholderElement(width, height) {
    this.placeholderElement = SortableList.createElement(this.getPlaceholderTemplate());
    this.placeholderElement.style.width = width;
    this.placeholderElement.style.height = height;

    return this.placeholderElement;
  }

  addEventListeners() {
    document.addEventListener('pointerdown', this.#onDocumentPointerDown);
    document.addEventListener('pointerup', this.#onDocumentPointerUp);
  }

  removeEventListeners() {
    document.removeEventListener('pointerdown', this.#onDocumentPointerDown);
    document.addEventListener('pointerup', this.#onDocumentPointerUp);
  }
}
