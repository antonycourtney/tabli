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
