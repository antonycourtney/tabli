import { log } from './globals';
import * as BC from './browserConstants';
import { TabWindow } from './tabWindow';
import findLastIndex from 'lodash/findLastIndex';
export const mkUrl = (relPath: string) =>
    'url("' + BC.BROWSER_PATH_PREFIX + relPath + '")';

const _ = {
    findLastIndex,
};

/**
 * Object merge operator from the original css-in-js presentation
 */

export function merge() {
    var res = {};

    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i]) {
            Object.assign(res, arguments[i]);
        } else {
            if (typeof arguments[i] === 'undefined') {
                throw new Error('m(): argument ' + i + ' undefined');
            }
        }
    }

    return res;
}
/*
 * sort criteria for window list:
 *   open windows first, then alpha by title
 *
 * If sortOrder is 'recent', then sort open windows by lastActive timestamp
 */

export function windowCmp(
    sortOrder: 'alpha' | 'recent',
    currentWindowId: number,
) {
    const cf = (tabWindowA: TabWindow, tabWindowB: TabWindow) => {
        // current window always very first:
        if (tabWindowA.open && tabWindowA.openWindowId === currentWindowId) {
            return -1;
        }

        if (tabWindowB.open && tabWindowB.openWindowId === currentWindowId) {
            return 1;
        } // open windows first:

        if (tabWindowA.open !== tabWindowB.open) {
            if (tabWindowA.open) {
                return -1;
            }

            return 1;
        }

        if (sortOrder === 'recent') {
            // sort open windows by lastActive timestamp:
            // timestamps first:
            if (tabWindowA.open && tabWindowB.open) {
                const tsA = tabWindowA.lastActive;
                const tsB = tabWindowB.lastActive;
                if (tsA && tsB) {
                    const ret = tsB - tsA;
                    return ret;
                }
                if (tsA) {
                    return -1;
                }
                if (tsB) {
                    return 1;
                }
            }
        }
        var tA = tabWindowA.title;
        var tB = tabWindowB.title;
        const ret = tA.localeCompare(tB, navigator.language, {
            sensitivity: 'base',
        });
        return ret;
    };

    return cf;
}
export var isNode = false;

if (typeof process === 'object') {
    if (typeof process.versions === 'object') {
        if (typeof process.versions.node !== 'undefined') {
            isNode = true;
        }
    }
}

// This function creates a new anchor element and uses location
// properties (inherent) to get the desired URL data. Some String
// operations are used (to normalize results across browsers).
// From http://james.padolsey.com/javascript/parsing-urls-with-the-dom/

type ParamsMap = { [key: string]: string };

interface ParsedURL {
    source: string;
    protocol: string;
    host: string;
    port: string;
    query: string;
    params: ParamsMap;
    file: string | null;
    hash: string;
    path: string;
    relative: string | null;
    segments: string[];
}

export function parseURL(url: string): ParsedURL {
    var a = document.createElement('a');
    a.href = url;
    return {
        source: url,
        protocol: a.protocol.replace(':', ''),
        host: a.hostname,
        port: a.port,
        query: a.search,
        params: (() => {
            var ret: ParamsMap = {};
            var seg = a.search.replace(/^\?/, '').split('&');
            var len = seg.length;
            var i = 0;
            var s;

            for (; i < len; i++) {
                if (!seg[i]) {
                    continue;
                }

                s = seg[i].split('=');
                ret[s[0]] = s[1];
            }

            return ret;
        })(),
        file: (a.pathname.match(/\/([^\/?#]+)$/i) || [null, ''])[1],
        // eslint-disable-line
        hash: a.hash.replace('#', ''),
        path: a.pathname.replace(/^([^\/])/, '/$1'),
        // eslint-disable-line
        relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [null, ''])[1],
        // eslint-disable-line
        segments: a.pathname.replace(/^\//, '').split('/'), // eslint-disable-line
    };
}

/**
 * drop parameters from an url
 */
export function baseURL(url: string): string {
    const idx = url.indexOf('?');
    const ret = idx >= 0 ? url.slice(0, idx) : url;
    return ret;
}

/**
 * Normalize a Google Doc URL to the base URL without any parameters
 * @param url
 * @returns
 */
export function normalizeGoogleDocURL(url: string): string {
    const googleDocsRegex =
        /^https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(googleDocsRegex);
    if (match) {
        return `${match[0]}`; // Return the base URL without any parameters
    }
    return url; // Return the original URL if it's not a Google Doc
}

export function isGoogleDocURL(url: string): boolean {
    const googleDocsRegex =
        /^https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([a-zA-Z0-9-_]+)/;
    return googleDocsRegex.test(url);
}

// ... (rest of the utils.ts file remains the same)

/**
 * chain a sequence of asynchronous actions
 * TODO: Investigate if this can go away with latest iteration of
 * oneRef with awaitableUpdate
 */
export function seqActions(actions: any, seed: any, onCompleted: any) {
    var index = 0;

    function invokeNext(v: any) {
        var action = actions[index];
        action(v, (res: any) => {
            index = index + 1;

            if (index < actions.length) {
                invokeNext(res);
            } else {
                onCompleted(res);
            }
        });
    }

    invokeNext(seed);
}
/**
 * Given a Map<K, number> of candidate matches over a space of key values K,
 * return the unambiguous best match (if any) otherwise null
 */
export function bestMatch<K>(matchMap: Map<K, number>): K | null {
    if (matchMap.size === 0) {
        return null;
    }

    const entries = Array.from(matchMap.entries());
    entries.sort((a, b) => a[1] - b[1]); // Sort by count (ascending)

    if (entries.length === 1) {
        return entries[0][0];
    }

    const topMatch = entries[entries.length - 1];
    const runnerUp = entries[entries.length - 2];

    if (topMatch[1] > runnerUp[1]) {
        return topMatch[0];
    }

    return null;
}
/*
var CONTEXT_MENU_ID = 99;
var contextMenuCreated = false;

function initContextMenu() {
  var sendToMenuItem = { type: "normal",
                     id: CONTEXT_MENU_ID,
                     title: "Open Link in Existing Window",
                     contexts: [ "link" ]
                    };
  chrome.contextMenus.create( sendToMenuItem, function() {
    contextMenuCreated = true;
  });
}
*/

/*
 * escape table cell for use in Github-Flavored Markdown
 * Since just used on a page title, just rewrite pipes to -s; GFM actually
 * buggy here: https://github.com/gitlabhq/gitlabhq/issues/1238
 */
export function escapeTableCell(s: string | null): string {
    if (s && s.indexOf('|') >= 0) {
        return s.replace(/\|/g, '-');
    }
    if (s != null) {
        return s;
    }
    return '';
}

export function areEqualShallow(a: any, b: any, debug = false): boolean {
    for (let key in a) {
        if (!(key in b) || a[key] !== b[key]) {
            if (debug) {
                log.debug('objects differ at key ', key);
            }
            return false;
        }
    }
    for (let key in b) {
        if (!(key in a)) {
            return false;
        }
    }
    return true;
}

// Set log level based on whether dev or prod:
export function setLogLevel(log: any) {
    const nodeEnv = process.env.NODE_ENV;

    const logLevel = nodeEnv === 'development' ? 'debug' : 'info';

    log.setLevel(logLevel);
    log.info(
        'utils.setLogLevel: Set log level to ',
        logLevel,
        ', log.getLevel(): ',
        log.getLevel(),
    );
}

let cachedIsExtension: boolean | undefined = undefined;

export const inExtension = (): boolean => {
    if (cachedIsExtension === undefined) {
        const runtime = (chrome as any).runtime;
        if (runtime === undefined) {
            return false; // should only happen when testing under jest
        }
        const { id } = runtime;
        cachedIsExtension = id !== null;
    }
    return cachedIsExtension;
};

type MbIndex = number | undefined;

export const getTabIndices = (tabWindow: TabWindow): [MbIndex, MbIndex][] => {
    const indices = tabWindow.tabItems.map((ti) => {
        const openIndex = ti.open ? ti.openState!.openTabIndex : undefined;
        const savedIndex = ti.saved ? ti.savedState!.bookmarkIndex : undefined;
        return [openIndex, savedIndex] as [MbIndex, MbIndex];
    });
    return indices;
};

// find the right open tab index for use in chrome.tabs.move:
export const getOpenTabIndex = (
    indices: [MbIndex, MbIndex][],
    dropIndex: number,
): number => {
    let entry = indices[dropIndex];
    if (entry && entry[0] !== undefined) {
        // common case:
        return entry[0];
    }
    let lastOpenIndex = _.findLastIndex(
        indices,
        (p) => p[0] !== undefined,
        dropIndex,
    );
    let lastOpenEntry = indices[lastOpenIndex];
    return lastOpenEntry[0]! + 1;
};

// Return the bookmark index IFF it is in the
// section after all open tabs, identified by
// all open tab indices being undefined:
// Note: This doesn't actually work particularly well,
// since windows are saved with previously open tabs
// in tab index order...
export const getSavedTabIndex = (
    indices: [MbIndex, MbIndex][],
    dropIndex: number,
): number | undefined => {
    let lastOpenIndex = _.findLastIndex(indices, (p) => p[0] !== undefined);
    if (dropIndex > lastOpenIndex && dropIndex < indices.length) {
        const entry = indices[dropIndex];
        return entry[1];
    }
    return undefined;
};

export const windowIsPopout = (): boolean => (window as any)._tabliIsPopout;

export function validChromeWindow(
    cw: chrome.windows.Window | null,
    normalOnly: boolean,
): boolean {
    if (!cw) {
        return false;
    }

    const cwTabs = cw.tabs || [];

    const isNormal = cw.type === 'normal' && cwTabs.length > 0;
    const isPopout =
        cw.type === 'popup' && cwTabs.length > 0 && cwTabs[0].title === 'Tabli';

    return isNormal || (!normalOnly && isPopout);
}
