// 1st implementation (iteration)
function createGetter1(path) {
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

// 2nd implementation (recursion)
function createGetter2(path) {
  const objectKeysPath = path.split('.');

  const getPropertyValue = obj => {
    const currentKey = objectKeysPath.shift();
    const isLastKey = objectKeysPath.length === 0;

    if (!obj.hasOwnProperty(currentKey)) {
      return;
    }

    const lastValue = obj[currentKey];
    if (isLastKey) {
      return lastValue;
    }

    return getPropertyValue(lastValue);
  };

  return obj => {
    return getPropertyValue(obj);
  };
}

/**
 * createGetter - creates function getter which allows select value from object
 * @param {string} path - the strings path separated by dot
 * @returns {function} - function-getter which allow get value from object by set path
 */
export function createGetter(path) {
  return createGetter1(path);
}
