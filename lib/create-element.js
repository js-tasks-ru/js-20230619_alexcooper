/**
 * Convert a template string into HTMLElement
 * @param  {String} html  Template string
 * @return {HTMLElement}  HTML Element
 */
export default function (html) {
  const element = document.createElement('template');
  element.innerHTML = html;

  return element.content.firstElementChild;
}
