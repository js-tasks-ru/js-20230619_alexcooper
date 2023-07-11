export function compareFunction(s1, s2) {
  return s1.localeCompare(s2, ['ru', 'en'], { caseFirst: 'upper' });
}

/**
 * Sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [order="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export default function(arr, order = 'asc') {
  const newArray = [...arr];

  const compareAscFunction = (a, b) => compareFunction(a, b);
  const compareDescFunction = (a, b) => compareFunction(b, a);

  return order === 'asc'
    ? newArray.sort(compareAscFunction)
    : newArray.sort((compareDescFunction));
}
