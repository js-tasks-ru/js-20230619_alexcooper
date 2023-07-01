/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export function sortStrings(arr, param = 'asc') {
  const newArray = [...arr];

  const compareFunction = (s1, s2) => s1.localeCompare(s2, ['ru', 'en'], { caseFirst: 'upper' });

  const sortFunction = (a, b) => param === 'asc'
    ? compareFunction(a, b)
    : compareFunction(b, a);

  return newArray.sort(sortFunction);
}
