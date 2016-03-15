// wrapper to log exceptions
export function logWrap(f) {
  function wf() {
    var ret;
    try {
      ret = f.apply(this, arguments);
    } catch (e) {
      console.error('logWrap: caught exception invoking function: ');
      console.error(e.stack);
      throw e;
    }

    return ret;
  }

  return wf;
}