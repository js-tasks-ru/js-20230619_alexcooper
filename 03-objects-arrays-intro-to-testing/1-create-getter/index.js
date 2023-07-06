/**
 * createGetter - creates function getter which allows select value from object
 * @param {string} path - the strings path separated by dot
 * @returns {function} - function-getter which allow get value from object by set path
 */
export function createGetter(path) {
  const objectKeysPath = path.split('.');

  return obj => {
    let result = obj;

    for (let key of objectKeysPath) {
      if (!result.hasOwnProperty(key)) {
        return;
      }

      result = result[key];
    }

    return result;
  };
}
