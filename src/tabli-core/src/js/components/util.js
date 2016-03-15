/**
 * Object merge operator from the original css-in-js presentation
 */
export function merge() {
  var res = {};
  for (var i = 0; i < arguments.length; i++) {
    if (arguments[i]) {
      Object.assign(res, arguments[i]);
    } else {
      if (typeof (arguments[i]) === 'undefined') {
        throw new Error('m(): argument ' + i + ' undefined');
      }
    }
  }

  return res;
}

/*
 * sort criteria for window list:
 *   open windows first, then alpha by title
 */
export function windowCmp(tabWindowA, tabWindowB) {
  // focused window very first:
  const fA = tabWindowA.focused;
  const fB = tabWindowB.focused;
  if (fA !== fB) {
    if (fA) {
      return -1;
    }
    return 1;
  }

  // open windows first:
  if (tabWindowA.open !== tabWindowB.open) {
    if (tabWindowA.open) {
      return -1;
    }
    return 1;
  }

  var tA = tabWindowA.title;
  var tB = tabWindowB.title;
  return tA.localeCompare(tB);
}
