function compareStrings(s1, s2) {
  return s1.localeCompare(s2, ['ru', 'en'], { caseFirst: 'upper' });
}

function compareNumbers(a, b) {
  return a - b;
}

function compare(a, b, type) {
  switch (type) {
  case 'string':
    return compareStrings(a, b);
  case 'number':
    return compareNumbers(a, b);
  default:
    throw new Error(`Unsupported compare type "${type}"`);
  }
}

/**
 * Sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [order="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
function sortStrings(arr, order = 'asc') {
  const newArray = [...arr];

  const compareAscFunction = (a, b) => compareStrings(a, b);
  const compareDescFunction = (a, b) => compareStrings(b, a);

  return order === 'asc'
    ? newArray.sort(compareAscFunction)
    : newArray.sort((compareDescFunction));
}

export {
  compareStrings,
  compareNumbers,
  compare,
  sortStrings,
};
