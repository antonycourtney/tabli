//
// Simple utilities to support Great Suspender integration
//
import * as log from 'loglevel' // eslint-disable-line

const SUSPEND_PREFIX = 'chrome-extension://klbibkeccnjlkjkiokjodocebajanakg/suspended.html#'
const SUSPEND_PREFIX_LEN = SUSPEND_PREFIX.length

const isSuspended = url => url.startsWith(SUSPEND_PREFIX)

/*
 * given a URI, return a [URI, Bool] pair with true URI and
 * suspended state
 */
export const getURI = (rawURI: string) => {
  let result
  if (isSuspended(rawURI)) {
    const suspendSuffix = rawURI.slice(SUSPEND_PREFIX_LEN)
    var searchParams = new URLSearchParams(suspendSuffix)

    // Iterate the search parameters.
    for (let [param, val] of searchParams) {
      if (param === 'uri') {
        result = [val, true]
      }
    }
  }
  if (!result) {
    result = [rawURI, false]
  }
  return result
}
