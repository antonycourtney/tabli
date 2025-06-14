//
// Simple utilities to support Great Suspender integration
//
import { log } from './globals'; // eslint-disable-line

const SUSPEND_PREFIXES = [
    'chrome-extension://klbibkeccnjlkjkiokjodocebajanakg/suspended.html#',
    'chrome-extension://lehkeldejnkfomdefgfhkhihdocphbdg/suspended.html#',
    'chrome-extension://ahmkjjgdligadogjedmnogbpbcpofeeo/suspended.html#',
    'chrome-extension://ainlmpkfinfbbgdpimmldfdgpenmclmk/suspended.html#',
    'chrome-extension://jaekigmcljkkalnicnjoafgfjoefkpeg/suspended.html#',
    'chrome-extension://noogafoofpebimajpfpamcfhoaifemoa/suspended.html#',
];
const SUSPEND_PREFIX_LEN = SUSPEND_PREFIXES[0].length;

const isSuspended = (url: string) =>
    SUSPEND_PREFIXES.find((prefix: string) =>
        url.startsWith(prefix)
    );
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
