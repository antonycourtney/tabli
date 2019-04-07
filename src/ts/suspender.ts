//
// Simple utilities to support Great Suspender integration
//
import * as log from 'loglevel'; // eslint-disable-line

const SUSPEND_PREFIX =
    'chrome-extension://klbibkeccnjlkjkiokjodocebajanakg/suspended.html#';
const ALT_SUSPEND_PREFIX =
    'chrome-extension://lehkeldejnkfomdefgfhkhihdocphbdg/suspended.html#';
const SUSPEND_PREFIX_LEN = SUSPEND_PREFIX.length;

const isSuspended = (url: string) =>
    url.startsWith(SUSPEND_PREFIX) || url.startsWith(ALT_SUSPEND_PREFIX);
/*
 * given a URI, return a [URI, boolean] pair with true URI and
 * suspended state
 */

export const getURI = (rawURI: string): [string, boolean] => {
    let result: [string, boolean] | undefined;

    if (isSuspended(rawURI)) {
        const suspendSuffix = rawURI.slice(SUSPEND_PREFIX_LEN);
        var searchParams = new URLSearchParams(suspendSuffix); // Iterate the search parameters.

        for (let [param, val] of searchParams) {
            if (param === 'uri') {
                result = [val, true];
            }
        }
    }

    if (!result) {
        result = [rawURI, false];
    }

    return result;
};
